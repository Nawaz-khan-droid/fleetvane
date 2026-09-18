package com.fleetvane.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CompleteOnboardingRequest(
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "^(MANAGER|CLIENT)$", message = "Role must be MANAGER or CLIENT")
    String role,
    
    @NotBlank(message = "Company Name is required")
    String companyName,
    
    @NotBlank(message = "Phone Number is required")
    String phoneNumber,
    
    String metric,
    String industry
) {}
