package com.fleetvane.shipment.dto;

public record ProofOfDeliveryRequest(
    String photoBase64,
    String signatureBase64
) {}