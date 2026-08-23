package com.fleetvane.fleet.service;

import com.fleetvane.fleet.dto.CreateVehicleRequest;
import com.fleetvane.fleet.dto.UpdateVehicleLocationRequest;
import com.fleetvane.fleet.dto.VehicleDto;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.entity.Depot;
import com.fleetvane.fleet.repository.DepotRepository;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import com.fleetvane.tracking.dto.LocationUpdateRequest;
import com.fleetvane.tracking.service.TrackingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {
    
    private final VehicleRepository vehicleRepository;
    private final DepotRepository depotRepository;
    private final TrackingService trackingService;
    
    public VehicleService(VehicleRepository vehicleRepository, DepotRepository depotRepository, TrackingService trackingService) {
        this.vehicleRepository = vehicleRepository;
        this.depotRepository = depotRepository;
        this.trackingService = trackingService;
    }
    
    @Transactional(readOnly = true)
    public Page<VehicleDto> getAllVehicles(Pageable pageable, String status) {
        if (status != null && !status.isBlank()) {
            return vehicleRepository.findByStatus(status, pageable).map(this::mapToDto);
        }
        return vehicleRepository.findAll(pageable).map(this::mapToDto);
    }
    
    @Transactional(readOnly = true)
    public VehicleDto getVehicleById(Long id) {
        return vehicleRepository.findById(id)
            .map(this::mapToDto)
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
    }
    
    @Transactional
    public VehicleDto createVehicle(CreateVehicleRequest request) {
        Double initialLat = 19.0760;
        Double initialLng = 72.8777;

        if (request.lat() != null && request.lng() != null) {
            initialLat = request.lat();
            initialLng = request.lng();
        } else if (request.depotId() != null) {
            Depot depot = depotRepository.findById(request.depotId())
                .orElseThrow(() -> new ResourceNotFoundException("Depot", "id", request.depotId()));
            initialLat = depot.getLat();
            initialLng = depot.getLng();
        }

        Vehicle vehicle = new Vehicle(
            request.plateNumber(),
            request.type(),
            request.model(),
            request.capacity(),
            request.fuelType(),
            "AVAILABLE",
            initialLat,
            initialLng,
            0.0
        );
        return mapToDto(vehicleRepository.save(vehicle));
    }
    
    @Transactional
    public VehicleDto updateStatus(Long id, String status) {
        Vehicle vehicle = vehicleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        vehicle.setStatus(status);
        return mapToDto(vehicleRepository.save(vehicle));
    }
    
    @Transactional
    public VehicleDto updateLocation(Long id, UpdateVehicleLocationRequest request, String role, Long userId) {
        trackingService.updateVehicleLocation(id, new LocationUpdateRequest(
            request.lat(), request.lng(), request.heading(), null
        ), role, userId);
        return vehicleRepository.findById(id)
            .map(this::mapToDto)
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
    }
    
    private VehicleDto mapToDto(Vehicle vehicle) {
        return new VehicleDto(
            vehicle.getId(),
            vehicle.getPlateNumber(),
            vehicle.getType(),
            vehicle.getModel(),
            vehicle.getCapacity(),
            vehicle.getFuelType(),
            vehicle.getStatus(),
            vehicle.getLat(),
            vehicle.getLng(),
            vehicle.getHeading(),
            vehicle.getCreatedAt(),
            vehicle.getUpdatedAt()
        );
    }
}
