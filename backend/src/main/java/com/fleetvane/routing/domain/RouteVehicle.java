package com.fleetvane.routing.domain;

import ai.timefold.solver.core.api.domain.entity.PlanningEntity;
import ai.timefold.solver.core.api.domain.variable.PlanningListVariable;
import java.util.ArrayList;
import java.util.List;

@PlanningEntity
public class RouteVehicle {
    private Long id;
    private Long vehicleId;
    private Double lat;
    private Double lng;
    private Long capacityGrams;
    private Long volumeCapacity;

    @PlanningListVariable
    private List<DeliveryStop> stops = new ArrayList<>();

    public RouteVehicle() {}

    public RouteVehicle(Long id, Long vehicleId, Double lat, Double lng, Long capacityGrams, Long volumeCapacity) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.lat = lat;
        this.lng = lng;
        this.capacityGrams = capacityGrams;
        this.volumeCapacity = volumeCapacity;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Long getCapacityGrams() { return capacityGrams; }
    public void setCapacityGrams(Long capacityGrams) { this.capacityGrams = capacityGrams; }

    public Long getVolumeCapacity() { return volumeCapacity; }
    public void setVolumeCapacity(Long volumeCapacity) { this.volumeCapacity = volumeCapacity; }

    public List<DeliveryStop> getStops() { return stops; }
    public void setStops(List<DeliveryStop> stops) { this.stops = stops; }
}
