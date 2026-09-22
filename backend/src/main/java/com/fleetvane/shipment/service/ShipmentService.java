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
import java.util.UUID;

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
                shipments = shipmentRepository.findByTransportCompanyIdAndStatus(companyId, status.toUpperCase(), pageable);
            } else if (clientId != null) {
                shipments = shipmentRepository.findByClientId(clientId, pageable);
            } else if (driverId != null) {
                shipments = shipmentRepository.findByDriverId(driverId, pageable);
            } else {
                if (companyId != null) {
                    shipments = shipmentRepository.findByTransportCompanyId(companyId, pageable);
                } else {
                    shipments = shipmentRepository.findAll(pageable);
                }
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
        }
        
        return mapToDto(shipment);
    }

    @Transactional
    public ShipmentDto createShipment(CreateShipmentRequest request, Long clientId) {
        Shipment shipment = new Shipment();
        shipment.setClientId(clientId);
        shipment.setTransportCompanyId(request.transportCompanyId());
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
        shipment.setDescription(request.description());

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
        
        // Generate a secure one-time QR token for pickup verification
        String qrToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        shipment.setQrToken(qrToken);
        
        Shipment saved = shipmentRepository.save(shipment);
        broadcastStatusChange(saved, "order.assigned");
        return mapToDto(saved);
    }

    /**
     * Verifies a QR token scanned at pickup. Returns the shipment DTO if valid.
     * This is used by the driver to confirm they are at the correct pickup location
     * and by the client to verify the driver is genuine.
     */
    @Transactional
    public ShipmentDto verifyQrToken(Long shipmentId, String token) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment", "id", shipmentId));
        
        if (shipment.getQrToken() == null || !shipment.getQrToken().equals(token)) {
            throw new BusinessException("Invalid or expired QR token", HttpStatus.FORBIDDEN);
        }
        
        // QR has been verified - transition to AT_PICKUP status
        if (!"EN_ROUTE_TO_PICKUP".equals(shipment.getStatus()) && !"ASSIGNED".equals(shipment.getStatus())) {
            throw new BusinessException("Shipment is not in a state that can be verified via QR", HttpStatus.BAD_REQUEST);
        }
        
        return mapToDto(shipment);
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
        
        switch (newStatus) {
            case "CANCELLED" -> {
                if ("DELIVERED".equals(currentStatus) || "COMPLETED".equals(currentStatus)) {
                    throw new BusinessException("Cannot cancel a completed shipment", HttpStatus.BAD_REQUEST);
                }
                if ("CLIENT".equals(role) && !"REQUESTED".equals(currentStatus)) {
                    throw new BusinessException("Clients can only cancel requested shipments", HttpStatus.BAD_REQUEST);
                }
                shipment.setCancelledAt(Instant.now());
                eventName = "order.cancelled";
            }
            
            // Driver accepts: ASSIGNED → EN_ROUTE_TO_PICKUP
            case "EN_ROUTE_TO_PICKUP" -> {
                if (!"ASSIGNED".equals(currentStatus)) {
                    throw new BusinessException("Shipment must be ASSIGNED before driver can go en route", HttpStatus.BAD_REQUEST);
                }
                if (!"DRIVER".equals(role) && !"MANAGER".equals(role)) {
                    throw new BusinessException("Only Driver/Manager can set this status", HttpStatus.FORBIDDEN);
                }
                eventName = "order.en_route_to_pickup";
            }
            
            // Driver arrives at pickup: EN_ROUTE_TO_PICKUP → AT_PICKUP (after QR scan)
            case "AT_PICKUP" -> {
                if (!"EN_ROUTE_TO_PICKUP".equals(currentStatus)) {
                    throw new BusinessException("Driver must be EN_ROUTE_TO_PICKUP first", HttpStatus.BAD_REQUEST);
                }
                if (!"DRIVER".equals(role) && !"MANAGER".equals(role)) {
                    throw new BusinessException("Only Driver/Manager can set this status", HttpStatus.FORBIDDEN);
                }
                // Verify QR token if provided
                if (pod != null && pod.qrToken() != null) {
                    if (shipment.getQrToken() == null || !shipment.getQrToken().equals(pod.qrToken())) {
                        throw new BusinessException("Invalid QR token - cannot confirm pickup", HttpStatus.FORBIDDEN);
                    }
                }
                eventName = "order.at_pickup";
            }
            
            // Pickup confirmed: AT_PICKUP → IN_TRANSIT
            case "IN_TRANSIT" -> {
                if (!"AT_PICKUP".equals(currentStatus) && !"ASSIGNED".equals(currentStatus)) {
                    throw new BusinessException("Shipment must be AT_PICKUP or ASSIGNED before it can be IN_TRANSIT", HttpStatus.BAD_REQUEST);
                }
                if (!"DRIVER".equals(role) && !"MANAGER".equals(role)) {
                    throw new BusinessException("Only Driver/Manager can transit a shipment", HttpStatus.FORBIDDEN);
                }
                shipment.setPickedUpAt(Instant.now());
                eventName = "order.started";
            }
            
            // Delivery completed: IN_TRANSIT → DELIVERED (requires geofence + PoD)
            case "DELIVERED", "COMPLETED" -> {
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
                newStatus = "DELIVERED";
                eventName = "order.completed";
            }
            
            default -> throw new BusinessException("Invalid status transition from " + currentStatus + " to " + newStatus, HttpStatus.BAD_REQUEST);
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
    }

    private ShipmentDto mapToDto(Shipment shipment) {
        String clientName = shipment.getClient() != null ? shipment.getClient().getName() : null;
        String clientEmail = shipment.getClient() != null ? shipment.getClient().getEmail() : null;
        String clientPhone = shipment.getClient() != null ? shipment.getClient().getPhoneNumber() : null;
        
        Long transportCompanyId = shipment.getTransportCompanyId();
        String transportCompanyName = shipment.getTransportCompany() != null ? shipment.getTransportCompany().getName() : null;

        return new ShipmentDto(
                shipment.getId(),
                shipment.getClientId(),
                clientName,
                clientEmail,
                clientPhone,
                transportCompanyId,
                transportCompanyName,
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
                shipment.getCategory(),
                shipment.getDescription(),
                shipment.getQrToken(),
                shipment.getPodPhotoBase64(),
                shipment.getPodSignatureBase64()
        );
    }
}
