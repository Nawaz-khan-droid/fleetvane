package com.fleetvane.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record InviteDriverRequest(
        @NotBlank(message = "Driver name is required") String name,
        @NotBlank(message = "Driver email is required") @Email(message = "Driver email must be valid") String email,
        @NotBlank(message = "Phone number is required") @Pattern(regexp = "^[+0-9() -]{7,20}$", message = "Phone number must be valid") String phoneNumber,
        @NotBlank(message = "License number is required") String licenseNumber,
        Long vehicleId
) {
}
