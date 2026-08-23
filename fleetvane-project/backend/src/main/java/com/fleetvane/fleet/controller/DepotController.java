package com.fleetvane.fleet.controller;

import com.fleetvane.fleet.dto.CreateDepotRequest;
import com.fleetvane.fleet.dto.DepotDto;
import com.fleetvane.fleet.service.DepotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/depots")
@RequiredArgsConstructor
public class DepotController {

    private final DepotService depotService;

    @GetMapping
    public List<DepotDto> getAllDepots() {
        return depotService.getAllActiveDepots();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public DepotDto createDepot(@Valid @RequestBody CreateDepotRequest request) {
        return depotService.createDepot(request);
    }
}
