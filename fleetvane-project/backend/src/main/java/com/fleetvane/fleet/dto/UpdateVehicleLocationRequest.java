package com.fleetvane.fleet.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateVehicleLocationRequest(
    @NotNull Double lat,
    @NotNull Double lng,
    @NotNull Double heading
) {}
