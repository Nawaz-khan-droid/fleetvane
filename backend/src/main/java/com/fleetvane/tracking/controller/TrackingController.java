package com.fleetvane.tracking.controller;

import com.fleetvane.tracking.dto.LocationUpdateRequest;
import com.fleetvane.tracking.service.TrackingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PutMapping("/vehicles/{id}/location")
    @PreAuthorize("hasAnyRole('DRIVER', 'MANAGER')")
    public ResponseEntity<Void> updateLocation(
            @PathVariable Long id, 
            @Valid @RequestBody LocationUpdateRequest request) {
        trackingService.updateVehicleLocation(id, request);
        return ResponseEntity.ok().build();
    }
}
