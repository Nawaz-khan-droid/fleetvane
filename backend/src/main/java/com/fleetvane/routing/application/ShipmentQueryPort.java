package com.fleetvane.routing.application;

import java.util.List;

public interface ShipmentQueryPort {
    List<ShipmentData> findAllById(List<Long> shipmentIds);

    record ShipmentData(Long id, Double deliveryLatitude, Double deliveryLongitude, Long weightGrams, Double volumeM3) {}
}
