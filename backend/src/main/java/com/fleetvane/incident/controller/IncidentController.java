package com.fleetvane.incident.controller;

import com.fleetvane.incident.dto.CreateIncidentRequest;
import com.fleetvane.incident.dto.IncidentReportDto;
import com.fleetvane.incident.service.IncidentService;
import com.fleetvane.shared.exception.BusinessException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'DRIVER')")
    public Page<IncidentReportDto> getAllIncidents(Pageable pageable, Authentication authentication) {
        Long userId = extractUserId(authentication);
        String role = extractRole(authentication);
        
        return incidentService.getAllIncidents(pageable, role, userId);
    }

    @PostMapping
    @PreAuthorize("hasRole('DRIVER')")
    public IncidentReportDto reportIncident(
            @Valid @RequestBody CreateIncidentRequest request, 
            Authentication authentication) {
        Long driverId = extractUserId(authentication);
        return incidentService.reportIncident(request, driverId);
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
