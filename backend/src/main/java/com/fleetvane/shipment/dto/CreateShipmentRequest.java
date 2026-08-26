package com.fleetvane.shipment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

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
    Double weight,

    @Positive(message = "Length must be positive")
    Double lengthCm,

    @Positive(message = "Width must be positive")
    Double widthCm,

    @Positive(message = "Height must be positive")
    Double heightCm
) {
    /** Calculated volume in m³ from dimensions in cm. */
    public Double calculatedVolumeM3() {
        if (lengthCm == null || widthCm == null || heightCm == null) return null;
        return (lengthCm * widthCm * heightCm) / 1_000_000.0;
    }
}
