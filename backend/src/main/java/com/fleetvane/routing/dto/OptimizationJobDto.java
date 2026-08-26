package com.fleetvane.routing.dto;

import java.time.Instant;
import java.util.UUID;

public record OptimizationJobDto(
    UUID id,
    String status,
    Long requestedBy,
    String score,
    String errorMessage,
    String resultJson,
    Instant createdAt,
    Instant startedAt,
    Instant completedAt
) {}
