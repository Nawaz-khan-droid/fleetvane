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
    public Page<VehicleDto> getAllVehicles(Long companyId, Pageable pageable, String status) {
        if (status != null && !status.isBlank()) {
            return vehicleRepository.findByCompanyIdAndStatus(companyId, status, pageable).map(this::mapToDto);
        }
        return vehicleRepository.findByCompanyId(companyId, pageable).map(this::mapToDto);
    }
    
    @Transactional(readOnly = true)
    public VehicleDto getVehicleById(Long id, Long companyId) {
        return vehicleRepository.findByIdAndCompanyId(id, companyId)
            .map(this::mapToDto)
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
    }
    
    @Transactional
    public VehicleDto createVehicle(Long companyId, CreateVehicleRequest request) {
        long vehicleCount = vehicleRepository.countByCompanyId(companyId);
        if (vehicleCount >= 10) {
            throw new BusinessException("You have reached the maximum limit of 10 vehicles per account.", HttpStatus.BAD_REQUEST);
        }

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
        // Set volumetric defaults that the DB requires as NOT NULL
        vehicle.setMaxVolumeM3(30.0);
        vehicle.setCurrentWeightKg(0.0);
        vehicle.setCurrentVolumeM3(0.0);
        // Persist the depot association if provided
        if (request.depotId() != null) {
            vehicle.setDepotId(request.depotId());
        }
        vehicle.setCompanyId(companyId);
        return mapToDto(vehicleRepository.save(vehicle));
    }
    
    @Transactional
    public VehicleDto updateStatus(Long id, Long companyId, String status) {
        Vehicle vehicle = vehicleRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        vehicle.setStatus(status);
        return mapToDto(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void deleteVehicle(Long id, Long companyId) {
        Vehicle vehicle = vehicleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        try {
            vehicleRepository.delete(vehicle);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new BusinessException("Cannot delete vehicle because it is still referenced by other records (e.g. shipments or driver assignments).", HttpStatus.CONFLICT);
        }
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
