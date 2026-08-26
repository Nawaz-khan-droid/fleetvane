package com.fleetvane.fleet.service;

import com.fleetvane.fleet.dto.CreateVehicleRequest;
import com.fleetvane.fleet.dto.VehicleDto;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.entity.Depot;
import com.fleetvane.fleet.repository.DepotRepository;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {
    
    private final VehicleRepository vehicleRepository;
    private final DepotRepository depotRepository;

    public VehicleService(VehicleRepository vehicleRepository, DepotRepository depotRepository) {
        this.vehicleRepository = vehicleRepository;
        this.depotRepository = depotRepository;
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
        // NO hardcoded geographic defaults in production: the initial position must come
        // from real data — an explicit coordinate pair or a configured Depot.
        if (request.lat() == null || request.lng() == null) {
            if (request.depotId() == null) {
                throw new BusinessException(
                    "Vehicle creation requires either explicit lat/lng coordinates or a depotId. " +
                    "Refusing to place vehicles at a hardcoded default location.",
                    HttpStatus.BAD_REQUEST);
            }
        }

        Double initialLat;
        Double initialLng;

        if (request.lat() != null && request.lng() != null) {
            initialLat = request.lat();
            initialLng = request.lng();
        } else {
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
            vehicle.getMaxVolumeM3(),
            vehicle.getCurrentWeightKg(),
            vehicle.getCurrentVolumeM3(),
            vehicle.getDepotId(),
            vehicle.getCreatedAt(),
            vehicle.getUpdatedAt()
        );
    }
}
