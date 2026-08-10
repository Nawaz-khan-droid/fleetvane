package com.fleetvane.controller;

import com.fleetvane.model.Delivery;
import com.fleetvane.service.DeliveryService;
import com.fleetvane.solver.RouteSolverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteSolverService routeSolverService;
    private final DeliveryService deliveryService;

    @PostMapping("/optimize/{truckId}")
    public ResponseEntity<Void> optimizeRoute(@PathVariable Long truckId) {
        List<Delivery> deliveries = deliveryService.getDeliveriesByTruck(truckId);
        routeSolverService.optimizeRoute(truckId, deliveries);
        return ResponseEntity.ok().build();
    }
}
