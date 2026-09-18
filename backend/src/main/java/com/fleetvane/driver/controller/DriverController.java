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
    private final com.fleetvane.driver.shift.DriverShiftService shiftService;

    @GetMapping("")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public Page<DriverProfileDto> getAllDrivers(Pageable pageable) {
        return driverService.getAllDrivers(pageable);
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'DRIVER', 'ROLE_MANAGER', 'ROLE_ADMIN', 'ROLE_DRIVER')")
    public DriverProfileDto getProfileByUserId(@PathVariable Long userId) {
        return driverService.getProfileByUserId(userId);
    }

    @PostMapping("/{userId}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public DriverProfileDto createProfile(@PathVariable Long userId, @Valid @RequestBody CreateDriverProfileRequest request) {
        return driverService.createProfile(userId, request);
    }

    @PutMapping("/{userId}/availability")
    @PreAuthorize("hasAuthority('DRIVER')")
    public DriverProfileDto toggleAvailability(@PathVariable Long userId) {
        return driverService.toggleAvailability(userId);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN', 'ROLE_MANAGER', 'ROLE_ADMIN')")
    public org.springframework.http.ResponseEntity<Void> deleteDriver(@PathVariable Long userId) {
        driverService.deleteDriver(userId);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/shift/start")
    @PreAuthorize("hasAuthority('DRIVER')")
    public com.fleetvane.driver.shift.DriverShift startShift(@PathVariable Long userId, @RequestParam Long vehicleId) {
        return shiftService.startShift(userId, vehicleId);
    }

    @PostMapping("/{userId}/shift/end")
    @PreAuthorize("hasAuthority('DRIVER')")
    public com.fleetvane.driver.shift.DriverShift endShift(@PathVariable Long userId) {
        return shiftService.endShift(userId);
    }
}
