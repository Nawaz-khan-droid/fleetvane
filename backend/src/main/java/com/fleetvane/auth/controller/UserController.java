package com.fleetvane.auth.controller;

import com.fleetvane.auth.dto.AuthResponse;
import com.fleetvane.auth.dto.SignupRequest;
import com.fleetvane.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'MANAGER', 'ROLE_MANAGER')")
    public ResponseEntity<AuthResponse> createUser(
            @Valid @RequestBody SignupRequest request,
            org.springframework.security.core.Authentication authentication) {
        
        String targetRole = (request.role() != null && !request.role().isBlank()) ? request.role().toUpperCase() : "CLIENT";
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ADMIN") || a.getAuthority().equals("ROLE_ADMIN"));
        
        // MANAGER is strictly forbidden from creating ADMIN or MANAGER accounts (P0 Prevention)
        if (!isAdmin && ("ADMIN".equals(targetRole) || "MANAGER".equals(targetRole))) {
            throw new com.fleetvane.shared.exception.BusinessException(
                    "Forbidden: Managers cannot create ADMIN or MANAGER accounts.",
                    org.springframework.http.HttpStatus.FORBIDDEN
            );
        }

        AuthResponse response = authService.provisionUser(request, targetRole);
        return ResponseEntity.ok(response);
    }
}
