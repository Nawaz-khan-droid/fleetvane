package com.fleetvane.fleet.adapter;

import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shipment.application.ShipmentVehicleQueryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ShipmentVehicleQueryAdapter implements ShipmentVehicleQueryPort {

    private final VehicleRepository vehicleRepository;

    public ShipmentVehicleQueryAdapter(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public Optional<VehicleData> findById(Long vehicleId) {
        return vehicleRepository.findById(vehicleId).map(this::toData);
    }

    @Override
    public void markInUse(Long vehicleId) {
        vehicleRepository.findById(vehicleId).ifPresent(vehicle -> {
            vehicle.setStatus("IN_USE");
            vehicleRepository.save(vehicle);
        });
    }

    private VehicleData toData(Vehicle vehicle) {
        return new VehicleData(vehicle.getId(), vehicle.getPlateNumber(), vehicle.getType(),
                vehicle.getModel(), vehicle.getLat(), vehicle.getLng(), vehicle.getHeading(),
                vehicle.getStatus(), vehicle.getCompanyId());
    }
}
