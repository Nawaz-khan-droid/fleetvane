package com.fleetvane.driver.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateDriverProfileRequest(
    @NotBlank String licenseNumber,
    @NotNull Long vehicleId
) {}
