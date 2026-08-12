package com.fleetvane.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateIncidentRequest(
    @NotBlank(message = "Type is required")
    String type,
    
    @NotBlank(message = "Description is required")
    String description,
    
    Double lat,
    Double lng,
    
    Long shipmentId
) {}
