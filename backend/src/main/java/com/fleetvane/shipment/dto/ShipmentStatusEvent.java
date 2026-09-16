package com.fleetvane.shipment.dto;

/**
 * WebSocket broadcast payload for shipment status changes.
 */
public record ShipmentStatusEvent(
    Long shipmentId,
    String event,     // "order.dispatched" | "order.started" | "order.completed" | "order.cancelled"
    String status,
    Long driverId,
    Long vehicleId,
    String originAddress,
    String destinationAddress
) {}