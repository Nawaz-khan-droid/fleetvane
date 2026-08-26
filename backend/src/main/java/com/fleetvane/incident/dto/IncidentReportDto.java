package com.fleetvane.incident.dto;

import java.time.Instant;

public record IncidentReportDto(
    Long id,
    String type,
    String description,
    Double lat,
    Double lng,
    Long driverId,
    Long shipmentId,
    Instant createdAt
) {}
