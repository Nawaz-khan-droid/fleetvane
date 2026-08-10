package com.fleetvane.controller;

import com.fleetvane.model.Incident;
import com.fleetvane.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    @PostMapping
    public ResponseEntity<Incident> reportIncident(@RequestBody Incident incident) {
        return ResponseEntity.ok(incidentService.reportIncident(incident));
    }
}
