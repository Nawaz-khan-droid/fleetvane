package com.fleetvane.routing.domain;

import ai.timefold.solver.core.api.domain.entity.PlanningEntity;
import ai.timefold.solver.core.api.domain.variable.InverseRelationShadowVariable;

@PlanningEntity
public class DeliveryStop {
    private Long id;
    private Long shipmentId;
    private Double lat;
    private Double lng;
    private Long demandGrams;
    private Long volumeDemand;

    @InverseRelationShadowVariable(sourceVariableName = "stops")
    private RouteVehicle vehicle;

    public DeliveryStop() {}

    public DeliveryStop(Long id, Long shipmentId, Double lat, Double lng, Long demandGrams, Long volumeDemand) {
        this.id = id;
        this.shipmentId = shipmentId;
        this.lat = lat;
        this.lng = lng;
        this.demandGrams = demandGrams;
        this.volumeDemand = volumeDemand;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getShipmentId() { return shipmentId; }
    public void setShipmentId(Long shipmentId) { this.shipmentId = shipmentId; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Long getDemandGrams() { return demandGrams; }
    public void setDemandGrams(Long demandGrams) { this.demandGrams = demandGrams; }

    public Long getVolumeDemand() { return volumeDemand; }
    public void setVolumeDemand(Long volumeDemand) { this.volumeDemand = volumeDemand; }

    public RouteVehicle getVehicle() { return vehicle; }
    public void setVehicle(RouteVehicle vehicle) { this.vehicle = vehicle; }
}
