package com.fleetvane.shipment.controller;

import com.fleetvane.shipment.dto.CreateShipmentRequest;
import com.fleetvane.shipment.dto.ShipmentDto;
import com.fleetvane.shipment.service.ShipmentService;
import com.fleetvane.shared.exception.BusinessException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipments")
@PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'MANAGER', 'ROLE_MANAGER', 'DRIVER', 'ROLE_DRIVER', 'CLIENT', 'ROLE_CLIENT')")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @GetMapping
    public Page<ShipmentDto> getAllShipments(
            Pageable pageable,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long driverId,
            Authentication authentication) {
        
        Long userId = extractUserId(authentication);
        String role = extractRole(authentication);
        
        return shipmentService.getAllShipments(pageable, status, clientId, driverId, role, userId);
    }

    @GetMapping("/{id}")
    public ShipmentDto getShipmentById(@PathVariable Long id, Authentication authentication) {
        Long userId = extractUserId(authentication);
        String role = extractRole(authentication);
        
        return shipmentService.getShipmentById(id, role, userId);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('MANAGER', 'CLIENT', 'ROLE_MANAGER', 'ROLE_CLIENT')")
    public ShipmentDto createShipment(@Valid @RequestBody CreateShipmentRequest request, Authentication authentication) {
        Long clientId = extractUserId(authentication);
        return shipmentService.createShipment(request, clientId);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('MANAGER')")
    public ShipmentDto assignShipment(
            @PathVariable Long id, 
            @RequestParam Long vehicleId, 
            @RequestParam Long driverId) {
        return shipmentService.assignShipment(id, vehicleId, driverId);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('DRIVER', 'ROLE_DRIVER', 'MANAGER', 'ROLE_MANAGER', 'ADMIN', 'ROLE_ADMIN')")
    public ShipmentDto updateStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication) {
        Long userId = extractUserId(authentication);
        String role = extractRole(authentication);
        
        return shipmentService.updateStatus(id, status, role, userId);
    }
    
    private Long extractUserId(Authentication authentication) {
        // JwtAuthFilter is passing a Spring User object where the username is the email.
        // Wait, the JWT filter currently puts the email as the username. 
        // We need the ID. Let's fix the JWT filter to pass the ID in the UserDetails or extract it.
        // Actually, the easiest way is to add a custom Authentication object or just fetch it from DB.
        // Since we want stateless, I should have put the ID in the username instead of email, or passed it in details.
        
        // Let's assume JwtAuthFilter put the userId as the username (String).
        // Let's check JwtAuthFilter. I put `userDetails = new User(userEmail, ...)`.
        // This is a bug in my flow: I need the User ID for relationships, not the email!
        // I will throw an exception here and we will fix JwtAuthFilter in the next step.
        // For now, let's parse it if it's stringified ID, else we need a different approach.
        
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            // If it's an email, this will fail. We need to patch JwtAuthFilter!
            throw new BusinessException("Authentication must use user ID as principal name", HttpStatus.UNAUTHORIZED);
        }
    }
    
    private String extractRole(Authentication authentication) {
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (authority.getAuthority().startsWith("ROLE_")) {
                return authority.getAuthority().substring(5);
            }
        }
        return "CLIENT";
    }
}
