package com.fleetvane.shared.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Fails fast at boot if the JWT signing secret is missing, blank, too short for
 * HS256 (< 32 bytes = 256 bits), or still set to a known insecure default.
 *
 * Defense-in-depth companion to `secret: ${JWT_SECRET}` in application.yml:
 * the placeholder forces presence; this guard rejects *unusable* values that
 * would otherwise surface as an obscure crypto exception mid-request.
 */
@Configuration
public class SecuritySanityConfig {

    static final int MIN_SECRET_BYTES = 32;
    private static final String[] KNOWN_INSECURE_DEFAULTS = {
            "fallback",
            "change-in-production",
            "fleetvane-capstone-jwt-secret-key-2026-minimum-256-bits-required"
    };

    @Value("${fleetvane.jwt.secret}")
    private String jwtSecret;

    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException(
                "CRITICAL SECURITY FAILURE: JWT_SECRET environment variable is missing or empty. " +
                "Refusing to boot — set a strong secret (>= " + MIN_SECRET_BYTES + " bytes) before starting FleetVane."
            );
        }
        if (jwtSecret.getBytes().length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                "CRITICAL SECURITY FAILURE: JWT_SECRET is weaker than " + MIN_SECRET_BYTES +
                " bytes (current length: " + jwtSecret.getBytes().length + "). HS256 requires >= 256 bits."
            );
        }
        for (String knownDefault : KNOWN_INSECURE_DEFAULTS) {
            if (jwtSecret.toLowerCase().contains(knownDefault.toLowerCase())) {
                throw new IllegalStateException(
                    "CRITICAL SECURITY FAILURE: JWT_SECRET matches a known insecure default pattern ('" +
                    knownDefault + "'). Generate a unique random secret for this environment."
                );
            }
        }
    }
}
