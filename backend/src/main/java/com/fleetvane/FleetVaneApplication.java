package com.fleetvane;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.flywaydb.core.Flyway;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan // registers records like fleetvane.shared.ratelimit.RateLimitProperties
public class FleetVaneApplication {

    public static void main(String[] args) {
        SpringApplication.run(FleetVaneApplication.class, args);
    }

    @Bean
    public CommandLineRunner flywayRepairRunner(Flyway flyway) {
        return args -> {
            flyway.repair();
        };
    }
}
