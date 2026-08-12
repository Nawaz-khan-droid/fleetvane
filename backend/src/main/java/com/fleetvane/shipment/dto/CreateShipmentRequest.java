package com.fleetvane.shipment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public record CreateShipmentRequest(
    @NotBlank(message = "Origin address is required")
    String originAddress,
    
    Double originLat,
    Double originLng,
    
    @NotBlank(message = "Destination address is required")
    String destinationAddress,
    
    Double destinationLat,
    Double destinationLng,
    
    @NotNull(message = "Weight is required")
    @Positive(message = "Weight must be positive")
    Double weight
) {}
