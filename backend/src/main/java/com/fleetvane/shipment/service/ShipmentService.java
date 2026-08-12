package com.fleetvane.shipment.service;

import com.fleetvane.shipment.dto.CreateShipmentRequest;
import com.fleetvane.shipment.dto.ShipmentDto;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;

    public ShipmentService(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    @Transactional(readOnly = true)
    public Page<ShipmentDto> getAllShipments(Pageable pageable, String status, Long clientId, Long driverId, String role, Long userId) {
        Page<Shipment> shipments;
        
        // Ownership Authorization Enforcement
        if ("CLIENT".equals(role)) {
            // Client can only see their own
            shipments = shipmentRepository.findByClientId(userId, pageable);
        } else if ("DRIVER".equals(role)) {
            // Driver can only see assigned
            shipments = shipmentRepository.findByDriverId(userId, pageable);
        } else {
            // Manager can see all, apply filters if provided
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
    public ShipmentDto getShipmentById(Long id, String role, Long userId) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment", "id", id));
                
        // Ownership Authorization Enforcement
        if ("CLIENT".equals(role) && !shipment.getClientId().equals(userId)) {
            throw new BusinessException("Access Denied: You do not own this shipment", HttpStatus.FORBIDDEN);
        }
        if ("DRIVER".equals(role) && !userId.equals(shipment.getDriverId())) {
            throw new BusinessException("Access Denied: You are not assigned to this shipment", HttpStatus.FORBIDDEN);
        }
        
        return mapToDto(shipment);
    }

    @Transactional
    public ShipmentDto createShipment(CreateShipmentRequest request, Long clientId) {
        Shipment shipment = new Shipment();
        shipment.setClientId(clientId);
        shipment.setStatus("REQUESTED");
        shipment.setOriginAddress(request.originAddress());
        shipment.setOriginLat(request.originLat());
        shipment.setOriginLng(request.originLng());
        shipment.setDestinationAddress(request.destinationAddress());
        shipment.setDestinationLat(request.destinationLat());
        shipment.setDestinationLng(request.destinationLng());
        shipment.setWeight(request.weight());
        
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
        
        return mapToDto(shipmentRepository.save(shipment));
    }

    @Transactional
    public ShipmentDto updateStatus(Long id, String newStatus, String role, Long userId) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment", "id", id));
                
        // Authorization for updates
        if ("CLIENT".equals(role) && !shipment.getClientId().equals(userId)) {
            throw new BusinessException("Access Denied", HttpStatus.FORBIDDEN);
        }
        if ("DRIVER".equals(role) && !userId.equals(shipment.getDriverId())) {
            throw new BusinessException("Access Denied", HttpStatus.FORBIDDEN);
        }
        
        newStatus = newStatus.toUpperCase();
        String currentStatus = shipment.getStatus();
        
        // State Machine validation
        if ("CANCELLED".equals(newStatus)) {
            if ("DELIVERED".equals(currentStatus)) {
                throw new BusinessException("Cannot cancel a delivered shipment", HttpStatus.BAD_REQUEST);
            }
            if ("CLIENT".equals(role) && !"REQUESTED".equals(currentStatus)) {
                throw new BusinessException("Clients can only cancel requested shipments", HttpStatus.BAD_REQUEST);
            }
            shipment.setCancelledAt(Instant.now());
            
        } else if ("IN_TRANSIT".equals(newStatus)) {
            if (!"ASSIGNED".equals(currentStatus)) {
                throw new BusinessException("Shipment must be ASSIGNED before it can be IN_TRANSIT", HttpStatus.BAD_REQUEST);
            }
            if (!"DRIVER".equals(role) && !"MANAGER".equals(role)) {
                throw new BusinessException("Only Driver/Manager can transit a shipment", HttpStatus.FORBIDDEN);
            }
            shipment.setPickedUpAt(Instant.now());
            
        } else if ("DELIVERED".equals(newStatus)) {
            if (!"IN_TRANSIT".equals(currentStatus)) {
                throw new BusinessException("Shipment must be IN_TRANSIT before it can be DELIVERED", HttpStatus.BAD_REQUEST);
            }
            if (!"DRIVER".equals(role) && !"MANAGER".equals(role)) {
                throw new BusinessException("Only Driver/Manager can deliver a shipment", HttpStatus.FORBIDDEN);
            }
            shipment.setDeliveredAt(Instant.now());
            
        } else {
            throw new BusinessException("Invalid status transition from " + currentStatus + " to " + newStatus, HttpStatus.BAD_REQUEST);
        }
        
        shipment.setStatus(newStatus);
        return mapToDto(shipmentRepository.save(shipment));
    }

    private ShipmentDto mapToDto(Shipment shipment) {
        return new ShipmentDto(
                shipment.getId(),
                shipment.getClientId(),
                shipment.getStatus(),
                shipment.getOriginAddress(),
                shipment.getOriginLat(),
                shipment.getOriginLng(),
                shipment.getDestinationAddress(),
                shipment.getDestinationLat(),
                shipment.getDestinationLng(),
                shipment.getWeight(),
                shipment.getEta(),
                shipment.getAssignedAt(),
                shipment.getPickedUpAt(),
                shipment.getDeliveredAt(),
                shipment.getCancelledAt(),
                shipment.getVehicleId(),
                shipment.getDriverId(),
                shipment.getCreatedAt(),
                shipment.getUpdatedAt()
        );
    }
}
