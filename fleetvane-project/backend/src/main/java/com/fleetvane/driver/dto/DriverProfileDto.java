package com.fleetvane.driver.dto;

import java.time.Instant;

public record DriverProfileDto(
    Long id,
    Long userId,
    String userName,
    String licenseNumber,
    Long vehicleId,
    Boolean isAvailable,
    Instant createdAt,
    Instant updatedAt
) {}
