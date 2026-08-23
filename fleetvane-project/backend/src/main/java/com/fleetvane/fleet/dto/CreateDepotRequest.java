package com.fleetvane.fleet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateDepotRequest(
    @NotBlank String name,
    @NotBlank String city,
    String address,
    @NotNull Double lat,
    @NotNull Double lng
) {}
