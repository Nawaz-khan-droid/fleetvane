package com.fleetvane.tracking.dto;

/**
 * WebSocket broadcast payload for a vehicle GPS ping.
 * Matches the Fleetbase driver.location_changed event shape.
 */
public record VehicleLocationEvent(
    Long vehicleId,
    String plateNumber,
    Double lat,
    Double lng,
    Double heading,
    Double speed,
    String status,
    Long currentShipmentId
) {}