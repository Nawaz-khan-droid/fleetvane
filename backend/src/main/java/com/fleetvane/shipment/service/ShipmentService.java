package com.fleetvane.shipment.service;

import com.fleetvane.shipment.dto.CreateShipmentRequest;
import com.fleetvane.shipment.dto.ShipmentDto;
import com.fleetvane.shipment.dto.ShipmentStatusEvent;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final SimpMessagingTemplate ws;

    public ShipmentService(ShipmentRepository shipmentRepository, SimpMessagingTemplate ws) {
        this.shipmentRepository = shipmentRepository;
        this.ws = ws;
    }

    @Transactional(readOnly = true)
    public Page<ShipmentDto> getAllShipments(Pageable pageable, String status, Long clientId, Long driverId, String role, Long userId, Long companyId) {
        Page<Shipment> shipments;
        
        if ("CLIENT".equals(role)) {
            shipments = shipmentRepository.findByClientId(userId, pageable);
        } else if ("DRIVER".equals(role)) {
            shipments = shipmentRepository.findByDriverId(userId, pageable);
        } else {
            if (status != null && !status.isBlank()) {
                shipments = shipmentRepository.findByStatus(status.toUpperCase(), pageable);
            } else if (clientId != null) {
                shipments = shipmentRepository.findByClientId(clientId, pageable);
            } else if (driverId != null) {
                shipments = shipmentRepository.findByDriverId(driverId, pageable);
            } else {
                shipments = shipmentRepository.findAll(pageable);
            }
        }
        
        return shipments.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public ShipmentDto getShipmentById(Long id, String role, Long userId, Long companyId) {
        Shipment shipment;
        
        if ("CLIENT".equals(role) || "ROLE_CLIENT".equals(role)) {
            shipment = shipmentRepository.findByIdAndClientId(id, userId)
                    .orElseThrow(() -> new BusinessException("Access Denied: You do not own this shipment", HttpStatus.FORBIDDEN));
        } else if ("DRIVER".equals(role) || "ROLE_DRIVER".equals(role)) {
            shipment = shipmentRepository.findByIdAndDriverId(id, userId)
                    .orElseThrow(() -> new BusinessException("Access Denied: You are not assigned to this shipment", HttpStatus.FORBIDDEN));
        } else {
            shipment = shipmentRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Shipment", "id", id));
            // Open marketplace: Managers can view any shipment details
        }
        
        return mapToDto(shipment);
    }

    @Transactional
    public ShipmentDto createShipment(CreateShipmentRequest request, Long clientId) {
        Shipment shipment = new Shipment();
        shipment.setClientId(clientId);
        shipment.setStatus("REQUESTED");
        shipment.setOriginAddress(request.originAddress());
        shipment.setPickupLatitude(request.pickupLatitude());
        shipment.setPickupLongitude(request.pickupLongitude());
        shipment.setDestinationAddress(request.destinationAddress());
        shipment.setDeliveryLatitude(request.deliveryLatitude());
        shipment.setDeliveryLongitude(request.deliveryLongitude());
        shipment.setWeight(request.weight());
        shipment.setLengthCm(request.lengthCm());
        shipment.setWidthCm(request.widthCm());
        shipment.setHeightCm(request.heightCm());
        shipment.setVolumeM3(request.calculatedVolumeM3());
        shipment.setCategory(request.category());

        return mapToDto(shipmentRepository.save(shipment));
    }

    @Transactional
    public ShipmentDto assignShipment(Long id, Long vehicleId, Long driverId) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment", "id", id));
                
        if (!"REQUESTED".equals(shipment.getStatus())) {
            throw new BusinessException("Only REQUESTED shipments can be assigned", HttpStatus.BAD_REQUEST);
        }
        
        shipment.setVehicleId(vehicleId);
        shipment.setDriverId(driverId);
        shipment.setStatus("ASSIGNED");
        shipment.setAssignedAt(Instant.now());
        
        Shipment saved = shipmentRepository.save(shipment);
        broadcastStatusChange(saved, "order.assigned");
        return mapToDto(saved);
    }

    @Transactional
    public ShipmentDto updateStatus(Long id, String newStatus, com.fleetvane.shipment.dto.ProofOfDeliveryRequest pod, String role, Long userId) {
        Shipment shipment;
        
        if ("CLIENT".equals(role) || "ROLE_CLIENT".equals(role)) {
            shipment = shipmentRepository.findByIdAndClientId(id, userId)
                    .orElseThrow(() -> new BusinessException("Access Denied", HttpStatus.FORBIDDEN));
        } else if ("DRIVER".equals(role) || "ROLE_DRIVER".equals(role)) {
            shipment = shipmentRepository.findByIdAndDriverId(id, userId)
                    .orElseThrow(() -> new BusinessException("Access Denied", HttpStatus.FORBIDDEN));
        } else {
            shipment = shipmentRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Shipment", "id", id));
        }
        
        newStatus = newStatus.toUpperCase();
        String currentStatus = shipment.getStatus();
        String eventName = null;
        
        if ("CANCELLED".equals(newStatus)) {
            if ("DELIVERED".equals(currentStatus) || "COMPLETED".equals(currentStatus)) {
                throw new BusinessException("Cannot cancel a completed shipment", HttpStatus.BAD_REQUEST);
            }
            if ("CLIENT".equals(role) && !"REQUESTED".equals(currentStatus)) {
                throw new BusinessException("Clients can only cancel requested shipments", HttpStatus.BAD_REQUEST);
            }
            shipment.setCancelledAt(Instant.now());
            eventName = "order.cancelled";
            
        } else if ("IN_TRANSIT".equals(newStatus)) {
            if (!"ASSIGNED".equals(currentStatus)) {
                throw new BusinessException("Shipment must be ASSIGNED before it can be IN_TRANSIT", HttpStatus.BAD_REQUEST);
            }
            if (!"DRIVER".equals(role) && !"MANAGER".equals(role)) {
                throw new BusinessException("Only Driver/Manager can transit a shipment", HttpStatus.FORBIDDEN);
            }
            shipment.setPickedUpAt(Instant.now());
            eventName = "order.started";
            
        } else if ("DELIVERED".equals(newStatus) || "COMPLETED".equals(newStatus)) {
            if (!"IN_TRANSIT".equals(currentStatus)) {
                throw new BusinessException("Shipment must be IN_TRANSIT before it can be DELIVERED", HttpStatus.BAD_REQUEST);
            }
            if (!"DRIVER".equals(role) && !"MANAGER".equals(role)) {
                throw new BusinessException("Only Driver/Manager can deliver a shipment", HttpStatus.FORBIDDEN);
            }
            shipment.setDeliveredAt(Instant.now());
            if (pod != null) {
                shipment.setPodPhotoBase64(pod.photoBase64());
                shipment.setPodSignatureBase64(pod.signatureBase64());
            }
            newStatus = "DELIVERED"; // Standardize
            eventName = "order.completed";
            
        } else {
            throw new BusinessException("Invalid status transition from " + currentStatus + " to " + newStatus, HttpStatus.BAD_REQUEST);
        }
        
        shipment.setStatus(newStatus);
        Shipment saved = shipmentRepository.save(shipment);
        
        if (eventName != null) {
            broadcastStatusChange(saved, eventName);
        }
        
        return mapToDto(saved);
    }
    
    private void broadcastStatusChange(Shipment shipment, String eventName) {
        ShipmentStatusEvent event = new ShipmentStatusEvent(
                shipment.getId(),
                eventName,
                shipment.getStatus(),
                shipment.getDriverId(),
                shipment.getVehicleId(),
                shipment.getOriginAddress(),
                shipment.getDestinationAddress()
        );
        ws.convertAndSend("/topic/shipment." + shipment.getId() + ".tracking", event);
        
        // Also broadcast to company.1.drivers if needed (omitted for now to keep it scoped)
    }

    private ShipmentDto mapToDto(Shipment shipment) {
        return new ShipmentDto(
                shipment.getId(),
                shipment.getClientId(),
                shipment.getStatus(),
                shipment.getOriginAddress(),
                shipment.getPickupLatitude(),
                shipment.getPickupLongitude(),
                shipment.getDestinationAddress(),
                shipment.getDeliveryLatitude(),
                shipment.getDeliveryLongitude(),
                shipment.getWeight(),
                shipment.getLengthCm(),
                shipment.getWidthCm(),
                shipment.getHeightCm(),
                shipment.getVolumeM3(),
                shipment.getEta(),
                shipment.getAssignedAt(),
                shipment.getPickedUpAt(),
                shipment.getDeliveredAt(),
                shipment.getCancelledAt(),
                shipment.getVehicleId(),
                shipment.getDriverId(),
                shipment.getCreatedAt(),
                shipment.getUpdatedAt(),
                shipment.getCategory()
        );
    }
}
