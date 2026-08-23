package com.fleetvane.tracking.controller;

import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.tracking.dto.LocationUpdateRequest;
import com.fleetvane.tracking.entity.GpsEvent;
import com.fleetvane.tracking.service.TrackingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
            @Valid @RequestBody LocationUpdateRequest request,
            Authentication authentication) {
        Long userId = extractUserId(authentication);
        String role = extractRole(authentication);
        trackingService.updateVehicleLocation(id, request, role, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/vehicles/{id}/history")
    @PreAuthorize("hasAnyRole('DRIVER', 'MANAGER')")
    public ResponseEntity<Page<GpsEvent>> getVehicleHistory(
            @PathVariable Long id,
            Pageable pageable,
            Authentication authentication) {
        Long userId = extractUserId(authentication);
        String role = extractRole(authentication);
        return ResponseEntity.ok(trackingService.getVehicleHistory(id, pageable, role, userId));
    }

    private Long extractUserId(Authentication authentication) {
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            throw new BusinessException("Authentication must use user ID as principal name", HttpStatus.UNAUTHORIZED);
        }
    }

    private String extractRole(Authentication authentication) {
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (authority.getAuthority().startsWith("ROLE_")) {
                return authority.getAuthority().substring(5);
            }
        }
        return "DRIVER";
    }
}