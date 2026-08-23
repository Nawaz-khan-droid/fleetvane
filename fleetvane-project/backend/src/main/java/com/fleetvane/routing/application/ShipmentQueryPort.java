package com.fleetvane.routing.application;

import java.util.List;

/**
 * Application-facing interface that abstracts shipment queries for the routing module.
 * Decouples RouteSolverService from direct dependency on com.fleetvane.shipment.repository.ShipmentRepository.
 */
public interface ShipmentQueryPort {
    List<ShipmentData> findAllById(List<Long> shipmentIds);

    record ShipmentData(Long id, Double destinationLat, Double destinationLng, Long weightGrams) {}
}
