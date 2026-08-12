package com.fleetvane.auth.dto;

public record AuthResponse(
    String accessToken,
    UserDto user
) {
    public record UserDto(
        Long id,
        String email,
        String name,
        String role
    ) {}
}
