package com.fleetvane.fleet.adapter;

import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import com.fleetvane.tracking.application.VehiclePersistencePort;
import org.springframework.stereotype.Component;

/**
 * Fleet-side adapter satisfying tracking's {@link VehiclePersistencePort}.
 * Keeps GPS persistence logic inside the module that owns the Vehicle aggregate,
 * while letting the tracking module depend only on its own abstraction.
 */
@Component
public class VehiclePersistenceAdapter implements VehiclePersistencePort {

    private final VehicleRepository vehicleRepository;

    public VehiclePersistenceAdapter(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public boolean vehicleExists(long vehicleId) {
        return vehicleRepository.existsById(vehicleId);
    }

    @Override
    public void applyGpsLocation(long vehicleId, double lat, double lng, Double heading) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        vehicle.setLat(lat);
        vehicle.setLng(lng);
        vehicle.setHeading(heading != null ? heading : 0.0);

        vehicleRepository.save(vehicle);
    }
}
