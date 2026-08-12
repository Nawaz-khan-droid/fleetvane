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
    private Double capacity;
    
    @PlanningListVariable
    private List<DeliveryStop> stops = new ArrayList<>();

    public RouteVehicle() {}

    public RouteVehicle(Long id, Long vehicleId, Double lat, Double lng, Double capacity) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.lat = lat;
        this.lng = lng;
        this.capacity = capacity;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Double getCapacity() { return capacity; }
    public void setCapacity(Double capacity) { this.capacity = capacity; }

    public List<DeliveryStop> getStops() { return stops; }
    public void setStops(List<DeliveryStop> stops) { this.stops = stops; }
}
