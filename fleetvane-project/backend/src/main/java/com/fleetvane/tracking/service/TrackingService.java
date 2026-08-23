package com.fleetvane.tracking.service;

import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import com.fleetvane.tracking.dto.LocationUpdateRequest;
import com.fleetvane.tracking.entity.GpsEvent;
import com.fleetvane.tracking.repository.GpsEventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrackingService {

    private final VehicleRepository vehicleRepository;
    private final GpsEventRepository gpsEventRepository;
    private final DriverProfileRepository driverProfileRepository;

    public TrackingService(VehicleRepository vehicleRepository,
                           GpsEventRepository gpsEventRepository,
                           DriverProfileRepository driverProfileRepository) {
        this.vehicleRepository = vehicleRepository;
        this.gpsEventRepository = gpsEventRepository;
        this.driverProfileRepository = driverProfileRepository;
    }

    private void enforceVehicleAccess(Long vehicleId, String role, Long userId) {
        if (!"DRIVER".equals(role)) {
            return;
        }
        DriverProfile profile = driverProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("No driver profile found", HttpStatus.FORBIDDEN));
        if (!vehicleId.equals(profile.getVehicleId())) {
            throw new BusinessException("You are not assigned to this vehicle", HttpStatus.FORBIDDEN);
        }
    }

    @Transactional
    public void updateVehicleLocation(Long vehicleId, LocationUpdateRequest request, String role, Long userId) {
        enforceVehicleAccess(vehicleId, role, userId);

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        vehicle.setLat(request.lat());
        vehicle.setLng(request.lng());
        vehicle.setHeading(request.heading() != null ? request.heading() : 0.0);

        vehicleRepository.save(vehicle);

        GpsEvent event = new GpsEvent(
                vehicleId,
                request.lat(),
                request.lng(),
                request.heading() != null ? request.heading() : 0.0,
                request.speed()
        );
        gpsEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public Page<GpsEvent> getVehicleHistory(Long vehicleId, Pageable pageable, String role, Long userId) {
        enforceVehicleAccess(vehicleId, role, userId);

        if (!vehicleRepository.existsById(vehicleId)) {
            throw new ResourceNotFoundException("Vehicle", "id", vehicleId);
        }
        return gpsEventRepository.findByVehicleIdOrderByRecordedAtDesc(vehicleId, pageable);
    }
}