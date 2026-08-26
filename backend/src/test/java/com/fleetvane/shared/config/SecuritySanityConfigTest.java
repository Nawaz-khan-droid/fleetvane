package com.fleetvane.shared.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the fail-fast security guard using a lightweight context runner —
 * no full application boot required.
 */
class SecuritySanityConfigTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(SecuritySanityConfig.class);

    private static final String VALID_SECRET = "x7Kp9Qw2Rt5Yv8Zb1Cd3Ef6Gh4Jk0MnPsQrUwXyZaBcDeFgHi";

    @Test
    @DisplayName("Boots cleanly with a strong, unique secret")
    void acceptsStrongSecret() {
        runner.withPropertyValues("fleetvane.jwt.secret=" + VALID_SECRET)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasBean("securitySanityConfig");
                });
    }

    @Test
    @DisplayName("FAILS FAST on blank secret")
    void rejectsBlankSecret() {
        runner.withPropertyValues("fleetvane.jwt.secret=   ")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasStackTraceContaining("CRITICAL SECURITY FAILURE")
                            .hasStackTraceContaining("missing or empty");
                });
    }

    @Test
    @DisplayName("FAILS FAST on secret shorter than 256 bits")
    void rejectsShortSecret() {
        runner.withPropertyValues("fleetvane.jwt.secret=too-short")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasStackTraceContaining("weaker than 32 bytes");
                });
    }

    @Test
    @DisplayName("FAILS FAST on known insecure default patterns")
    void rejectsKnownDefaults() {
        runner.withPropertyValues(
                        "fleetvane.jwt.secret=my-custom-prefix-fleetvane-capstone-jwt-secret-key-2026-minimum-256-bits-required-suffix")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasStackTraceContaining("known insecure default");
                });
    }
}
