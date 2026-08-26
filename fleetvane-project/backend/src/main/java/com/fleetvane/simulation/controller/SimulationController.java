package com.fleetvane.simulation.controller;

import com.fleetvane.simulation.service.SimulationService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@Profile("demo")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    /**
     * Unified lifecycle endpoint consumed by Manager/Driver dashboards:
     * {"action":"start"} -> seeds (once) + begins 5s movement ticks
     * {"action":"stop"}  -> halts movement
     * {"action":"status"}-> reports current running state
     */
    @PostMapping
    public ResponseEntity<String> control(@RequestBody Map<String, String> body) {
        String action = body == null ? null : body.get("action");
        switch (action == null ? "" : action.toLowerCase()) {
            case "start" -> {
                simulationService.start();
                return ResponseEntity.ok("Simulation started");
            }
            case "stop" -> {
                simulationService.stop();
                return ResponseEntity.ok("Simulation stopped");
            }
            case "status" -> {
                return ResponseEntity.ok("Simulation running: " + simulationService.isRunning());
            }
            default -> {
                return ResponseEntity.badRequest().body("Unknown action. Use start | stop | status.");
            }
        }
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