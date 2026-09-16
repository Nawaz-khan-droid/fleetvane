package com.fleetvane.routing.application;

import java.util.List;

public interface FleetQueryPort {
    List<VehicleData> findAllById(List<Long> vehicleIds);

    record VehicleData(Long id, Long originalId, Double lat, Double lng, Long capacityGrams, Double volumeM3) {}
}
