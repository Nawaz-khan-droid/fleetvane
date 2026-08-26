package com.fleetvane.routing.application;

import java.util.List;

public interface ShipmentQueryPort {
    List<ShipmentData> findAllById(List<Long> shipmentIds);

    record ShipmentData(Long id, Double destinationLat, Double destinationLng, Long weightGrams, Long volumeM3x1000) {}
}
