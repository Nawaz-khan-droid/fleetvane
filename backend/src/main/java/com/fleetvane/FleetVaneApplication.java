package com.fleetvane;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan // registers records like fleetvane.shared.ratelimit.RateLimitProperties
public class FleetVaneApplication {

    public static void main(String[] args) {
        SpringApplication.run(FleetVaneApplication.class, args);
    }
}
