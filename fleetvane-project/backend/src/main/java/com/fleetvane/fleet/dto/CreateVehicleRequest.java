package com.fleetvane.fleet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateVehicleRequest(
    @NotBlank String plateNumber,
    @NotBlank String type,
    @NotBlank String model,
    @NotNull @Positive Double capacity,
    @NotBlank String fuelType,
    Long depotId,
    Double lat,
    Double lng
) {}
