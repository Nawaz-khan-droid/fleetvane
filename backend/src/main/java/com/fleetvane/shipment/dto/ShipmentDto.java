package com.fleetvane.shipment.dto;

import java.time.Instant;

public record ShipmentDto(
    Long id,
    Long clientId,
    String status,
    String originAddress,
    Double originLat,
    Double originLng,
    String destinationAddress,
    Double destinationLat,
    Double destinationLng,
    Double weight,
    Instant eta,
    Instant assignedAt,
    Instant pickedUpAt,
    Instant deliveredAt,
    Instant cancelledAt,
    Long vehicleId,
    Long driverId,
    Instant createdAt,
    Instant updatedAt
) {}
