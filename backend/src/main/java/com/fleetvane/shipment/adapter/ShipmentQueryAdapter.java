package com.fleetvane.shipment.adapter;

import com.fleetvane.routing.application.ShipmentQueryPort;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ShipmentQueryAdapter implements ShipmentQueryPort {

    private final ShipmentRepository shipmentRepository;

    public ShipmentQueryAdapter(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    @Override
    public List<ShipmentData> findAllById(List<Long> shipmentIds) {
        return shipmentRepository.findAllById(shipmentIds).stream()
                .map(this::toData)
                .collect(Collectors.toList());
    }

    private ShipmentData toData(Shipment shipment) {
        long weightGrams = shipment.getWeight() != null ? (long) (shipment.getWeight() * 1000) : 0L;
        return new ShipmentData(
                shipment.getId(),
                shipment.getDestinationLat(),
                shipment.getDestinationLng(),
                weightGrams
        );
    }
}
