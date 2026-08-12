package com.fleetvane.fleet.service;

import com.fleetvane.fleet.dto.CreateVehicleRequest;
import com.fleetvane.fleet.dto.UpdateVehicleLocationRequest;
import com.fleetvane.fleet.dto.VehicleDto;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {
    
    private final VehicleRepository vehicleRepository;
    
    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
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
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }
    
    @Transactional
    public VehicleDto createVehicle(CreateVehicleRequest request) {
        Vehicle vehicle = new Vehicle(
            request.plateNumber(),
            request.type(),
            request.model(),
            request.capacity(),
            request.fuelType(),
            "AVAILABLE",
            19.076,
            72.8777,
            0.0
        );
        return mapToDto(vehicleRepository.save(vehicle));
    }
    
    @Transactional
    public VehicleDto updateStatus(Long id, String status) {
        Vehicle vehicle = vehicleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        vehicle.setStatus(status);
        return mapToDto(vehicleRepository.save(vehicle));
    }
    
    @Transactional
    public VehicleDto updateLocation(Long id, UpdateVehicleLocationRequest request) {
        Vehicle vehicle = vehicleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        vehicle.setLat(request.lat());
        vehicle.setLng(request.lng());
        vehicle.setHeading(request.heading());
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
            vehicle.getCreatedAt(),
            vehicle.getUpdatedAt()
        );
    }
}
