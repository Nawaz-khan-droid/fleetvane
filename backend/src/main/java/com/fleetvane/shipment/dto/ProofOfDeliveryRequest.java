package com.fleetvane.shipment.dto;

public record ProofOfDeliveryRequest(
    String photoBase64,
    String signatureBase64,
    /** QR token scanned at pickup to verify driver identity and correct location */
    String qrToken
) {}