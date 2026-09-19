package com.fleetvane.fleet.controller;

import com.fleetvane.fleet.dto.CreateVehicleRequest;
import com.fleetvane.fleet.dto.VehicleDto;
import com.fleetvane.fleet.service.VehicleService;
import com.fleetvane.shared.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final com.fleetvane.auth.repository.UserRepository userRepository;

    private Long getCurrentCompanyId() {
        String userIdStr = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(Long.parseLong(userIdStr)).map(com.fleetvane.auth.entity.User::getCompanyId).orElse(null);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public Page<VehicleDto> getAllVehicles(Pageable pageable, @RequestParam(required = false) String status) {
        return vehicleService.getAllVehicles(getCurrentCompanyId(), pageable, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public VehicleDto getVehicleById(@PathVariable Long id) {
        return vehicleService.getVehicleById(id, getCurrentCompanyId());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public VehicleDto createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        return vehicleService.createVehicle(getCurrentCompanyId(), request);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public VehicleDto updateStatus(@PathVariable Long id, @RequestParam String status) {
        return vehicleService.updateStatus(id, getCurrentCompanyId(), status);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public org.springframework.http.ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id, getCurrentCompanyId());
        return org.springframework.http.ResponseEntity.noContent().build();
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
