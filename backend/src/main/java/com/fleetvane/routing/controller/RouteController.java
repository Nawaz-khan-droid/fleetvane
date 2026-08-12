package com.fleetvane.routing.controller;

import com.fleetvane.routing.dto.CreateOptimizationJobRequest;
import com.fleetvane.routing.dto.OptimizationJobDto;
import com.fleetvane.routing.service.RouteSolverService;
import com.fleetvane.shared.exception.BusinessException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/routes/optimization-jobs")
public class RouteController {

    private final RouteSolverService routeSolverService;

    public RouteController(RouteSolverService routeSolverService) {
        this.routeSolverService = routeSolverService;
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public OptimizationJobDto submitJob(@Valid @RequestBody CreateOptimizationJobRequest request, Authentication authentication) {
        Long userId = extractUserId(authentication);
        return routeSolverService.submitJob(request, userId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public OptimizationJobDto getJobStatus(@PathVariable UUID id) {
        return routeSolverService.getJobStatus(id);
    }
    
    private Long extractUserId(Authentication authentication) {
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            throw new BusinessException("Authentication must use user ID as principal name", HttpStatus.UNAUTHORIZED);
        }
    }
}
