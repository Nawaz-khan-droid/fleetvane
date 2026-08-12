package com.fleetvane.routing.domain;

import ai.timefold.solver.core.api.domain.solution.PlanningEntityCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.PlanningScore;
import ai.timefold.solver.core.api.domain.solution.PlanningSolution;
import ai.timefold.solver.core.api.domain.solution.ProblemFactCollectionProperty;
import ai.timefold.solver.core.api.domain.valuerange.ValueRangeProvider;
import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import java.util.List;
import java.util.UUID;

@PlanningSolution
public class VehicleRoutePlan {
    private UUID id;

    @ProblemFactCollectionProperty
    @ValueRangeProvider
    private List<DeliveryStop> stops;

    @PlanningEntityCollectionProperty
    private List<RouteVehicle> vehicles;

    @PlanningScore
    private HardSoftScore score;

    public VehicleRoutePlan() {}
    
    public VehicleRoutePlan(UUID id, List<DeliveryStop> stops, List<RouteVehicle> vehicles) {
        this.id = id;
        this.stops = stops;
        this.vehicles = vehicles;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public List<DeliveryStop> getStops() { return stops; }
    public void setStops(List<DeliveryStop> stops) { this.stops = stops; }

    public List<RouteVehicle> getVehicles() { return vehicles; }
    public void setVehicles(List<RouteVehicle> vehicles) { this.vehicles = vehicles; }

    public HardSoftScore getScore() { return score; }
    public void setScore(HardSoftScore score) { this.score = score; }
}
