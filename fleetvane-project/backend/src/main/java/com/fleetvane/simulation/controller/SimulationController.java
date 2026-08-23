package com.fleetvane.simulation.controller;

import com.fleetvane.simulation.service.SimulationService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulation")
@Profile("demo")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/seed")
    public ResponseEntity<String> seedDemoData() {
        int created = simulationService.seedDemoData();
        return ResponseEntity.ok("Demo data seeded: " + created + " shipments created");
    }

    @PostMapping("/move")
    public ResponseEntity<String> advanceVehicles() {
        int moved = simulationService.advanceVehicles();
        return ResponseEntity.ok("Vehicles advanced: " + moved + " moved");
    }
}