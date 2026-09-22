package com.fleetvane.shipment.dto;

import java.time.Instant;

public record ShipmentDto(
    Long id,
    Long clientId,
    String clientName,
    String clientEmail,
    String clientPhone,
    Long transportCompanyId,
    String transportCompanyName,
    String status,
    String originAddress,
    Double pickupLatitude,
    Double pickupLongitude,
    String destinationAddress,
    Double deliveryLatitude,
    Double deliveryLongitude,
    Double weight,
    Double lengthCm,
    Double widthCm,
    Double heightCm,
    Double volumeM3,
    Instant eta,
    Instant assignedAt,
    Instant pickedUpAt,
    Instant deliveredAt,
    Instant cancelledAt,
    Long vehicleId,
    Long driverId,
    Instant createdAt,
    Instant updatedAt,
    String category,
    String description,
    String qrToken,
    String podPhotoBase64,
    String podSignatureBase64
) {}

