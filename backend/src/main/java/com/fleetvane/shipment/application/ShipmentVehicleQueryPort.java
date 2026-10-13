package com.fleetvane.shipment.application;

import java.util.Optional;

public interface ShipmentVehicleQueryPort {

    Optional<VehicleData> findById(Long vehicleId);

    void markInUse(Long vehicleId);

    record VehicleData(
            Long id,
            String plateNumber,
            String type,
            String model,
            Double lat,
            Double lng,
            Double heading,
            String status,
            Long companyId
    ) {}
}
