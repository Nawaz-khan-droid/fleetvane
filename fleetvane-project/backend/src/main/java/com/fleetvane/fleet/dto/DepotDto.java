package com.fleetvane.fleet.dto;

public record DepotDto(
    Long id,
    String name,
    String city,
    String address,
    Double lat,
    Double lng
) {}
