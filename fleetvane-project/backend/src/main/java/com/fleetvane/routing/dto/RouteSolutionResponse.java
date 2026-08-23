package com.fleetvane.routing.dto;

import java.util.List;
import java.util.UUID;

/**
 * Track B synchronous response: solved routes WITH coordinates so the
 * client can render polylines immediately without further lookups.
 */
public record RouteSolutionResponse(
    UUID jobId,
    String status,
    String score,
    List<VehicleRoute> routes
) {
    public record VehicleRoute(
        Long vehicleId,
        Long originalId,
        Double startLat,
        Double startLng,
        List<Stop> stops
    ) {}

    public record Stop(
        Long shipmentId,
        Double lat,
        Double lng
    ) {}
}
