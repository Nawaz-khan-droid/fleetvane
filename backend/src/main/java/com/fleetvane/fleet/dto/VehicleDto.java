package com.fleetvane.fleet.dto;

import java.time.Instant;

public record VehicleDto(
    Long id,
    String plateNumber,
    String type,
    String model,
    Double capacity,
    String fuelType,
    String status,
    Double lat,
    Double lng,
    Double heading,
    Double maxVolumeM3,
    Double currentWeightKg,
    Double currentVolumeM3,
    Long depotId,
    Instant createdAt,
    Instant updatedAt
) {}
