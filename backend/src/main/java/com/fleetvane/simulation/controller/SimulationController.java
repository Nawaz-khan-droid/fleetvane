package com.fleetvane.simulation.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulation")
@Profile("demo")
public class SimulationController {

    @PostMapping("/seed")
    public ResponseEntity<String> seedDemoData() {
        return ResponseEntity.ok("Demo data seeded (Mock)");
    }

    @PostMapping("/move")
    public ResponseEntity<String> advanceVehicles() {
        return ResponseEntity.ok("Vehicles advanced (Mock)");
    }
}
