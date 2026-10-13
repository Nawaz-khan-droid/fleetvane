package com.fleetvane.tracking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PositiveOrZero;

public record LocationUpdateRequest(
    @NotNull(message = "Latitude is required")
    @Min(value = -90, message = "Latitude must be >= -90")
    @Max(value = 90, message = "Latitude must be <= 90")
    Double lat,
    
    @NotNull(message = "Longitude is required")
    @Min(value = -180, message = "Longitude must be >= -180")
    @Max(value = 180, message = "Longitude must be <= 180")
    Double lng,
    
    @DecimalMin(value = "0", message = "Heading must be >= 0")
    @DecimalMax(value = "360", message = "Heading must be <= 360")
    Double heading,
    
    @PositiveOrZero(message = "Speed must be >= 0")
    @DecimalMax(value = "100", message = "Speed must be <= 100 m/s")
    Double speed
) {}
