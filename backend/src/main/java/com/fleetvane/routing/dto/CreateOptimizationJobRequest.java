package com.fleetvane.routing.dto;

import java.util.List;
import jakarta.validation.constraints.NotEmpty;

public record CreateOptimizationJobRequest(
    @NotEmpty(message = "At least one vehicle must be selected")
    List<Long> vehicleIds,
    
    @NotEmpty(message = "At least one shipment must be selected")
    List<Long> shipmentIds
) {}
