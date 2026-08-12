package com.fleetvane.driver.controller;

import com.fleetvane.driver.dto.CreateDriverProfileRequest;
import com.fleetvane.driver.dto.DriverProfileDto;
import com.fleetvane.driver.service.DriverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;

    @GetMapping("/")
    @PreAuthorize("hasAuthority('MANAGER')")
    public Page<DriverProfileDto> getAllDrivers(Pageable pageable) {
        return driverService.getAllDrivers(pageable);
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'DRIVER')")
    public DriverProfileDto getProfileByUserId(@PathVariable Long userId) {
        return driverService.getProfileByUserId(userId);
    }

    @PostMapping("/{userId}")
    @PreAuthorize("hasAuthority('MANAGER')")
    public DriverProfileDto createProfile(@PathVariable Long userId, @Valid @RequestBody CreateDriverProfileRequest request) {
        return driverService.createProfile(userId, request);
    }

    @PutMapping("/{userId}/availability")
    @PreAuthorize("hasAuthority('DRIVER')")
    public DriverProfileDto toggleAvailability(@PathVariable Long userId) {
        return driverService.toggleAvailability(userId);
    }
}
