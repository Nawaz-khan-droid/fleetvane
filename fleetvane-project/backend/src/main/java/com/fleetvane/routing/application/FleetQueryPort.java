package com.fleetvane.routing.application;

import java.util.List;

/**
 * Application-facing interface that abstracts fleet/vehicle queries for the routing module.
 * Decouples RouteSolverService from direct dependency on com.fleetvane.fleet.repository.VehicleRepository.
 */
public interface FleetQueryPort {
    List<VehicleData> findAllById(List<Long> vehicleIds);

    record VehicleData(Long id, Long originalId, Double lat, Double lng, Long capacityGrams) {}
}
