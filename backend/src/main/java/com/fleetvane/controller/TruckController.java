package com.fleetvane.controller;

import com.fleetvane.model.Truck;
import com.fleetvane.service.TruckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trucks")
@RequiredArgsConstructor
public class TruckController {

    private final TruckService truckService;

    @GetMapping("/")
    public ResponseEntity<List<Truck>> getAllTrucks() {
        return ResponseEntity.ok(truckService.getAllTrucks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Truck> getTruckById(@PathVariable Long id) {
        return ResponseEntity.ok(truckService.getTruckById(id));
    }

    @PostMapping("/")
    public ResponseEntity<Truck> createTruck(@RequestBody Truck truck) {
        return ResponseEntity.ok(truckService.createTruck(truck));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Truck> updateTruckStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(truckService.updateTruckStatus(id, status));
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<Truck> updateTruckLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Double> payload) {
        Double lat = payload.get("lat");
        Double lng = payload.get("lng");
        return ResponseEntity.ok(truckService.updateTruckLocation(id, lat, lng));
    }
}
