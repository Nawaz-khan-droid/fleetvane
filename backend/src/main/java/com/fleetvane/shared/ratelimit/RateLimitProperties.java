package com.fleetvane.shared.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Externalised knobs for the auth rate limiter (env-overridable, no magic
 * numbers compiled into production).
 */
@ConfigurationProperties(prefix = "fleetvane.ratelimit")
public record RateLimitProperties(
        boolean enabled,
        int capacity,
        long refillMinutes
) {
    public RateLimitProperties {
        if (capacity <= 0) capacity = 20;
        if (refillMinutes <= 0) refillMinutes = 1;
    }

    public static RateLimitProperties defaults() {
        return new RateLimitProperties(true, 20, 1);
    }
}
