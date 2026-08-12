package com.fleetvane.tracking.service;

import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import com.fleetvane.tracking.dto.LocationUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrackingService {

    private final VehicleRepository vehicleRepository;

    public TrackingService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional
    public void updateVehicleLocation(Long vehicleId, LocationUpdateRequest request) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));
                
        vehicle.setLat(request.lat());
        vehicle.setLng(request.lng());
        vehicle.setHeading(request.heading());
        
        vehicleRepository.save(vehicle);
    }
}
