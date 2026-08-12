package com.fleetvane.fleet.controller;

import com.fleetvane.fleet.dto.CreateVehicleRequest;
import com.fleetvane.fleet.dto.UpdateVehicleLocationRequest;
import com.fleetvane.fleet.dto.VehicleDto;
import com.fleetvane.fleet.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping("/")
    @PreAuthorize("hasAuthority('MANAGER')")
    public Page<VehicleDto> getAllVehicles(Pageable pageable, @RequestParam(required = false) String status) {
        return vehicleService.getAllVehicles(pageable, status);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGER')")
    public VehicleDto getVehicleById(@PathVariable Long id) {
        return vehicleService.getVehicleById(id);
    }

    @PostMapping("/")
    @PreAuthorize("hasAuthority('MANAGER')")
    public VehicleDto createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        return vehicleService.createVehicle(request);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('MANAGER')")
    public VehicleDto updateStatus(@PathVariable Long id, @RequestParam String status) {
        return vehicleService.updateStatus(id, status);
    }

    @PutMapping("/{id}/location")
    @PreAuthorize("hasAnyAuthority('DRIVER', 'MANAGER')")
    public VehicleDto updateLocation(@PathVariable Long id, @Valid @RequestBody UpdateVehicleLocationRequest request) {
        return vehicleService.updateLocation(id, request);
    }
}
