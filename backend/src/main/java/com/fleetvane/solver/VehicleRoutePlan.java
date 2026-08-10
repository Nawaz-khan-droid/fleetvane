package com.fleetvane.solver;

import ai.timefold.solver.core.api.domain.solution.PlanningEntityCollectionProperty;
import ai.timefold.solver.core.api.domain.solution.PlanningScore;
import ai.timefold.solver.core.api.domain.solution.PlanningSolution;
import ai.timefold.solver.core.api.domain.solution.ProblemFactCollectionProperty;
import ai.timefold.solver.core.api.domain.valuerange.ValueRangeProvider;
import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@PlanningSolution
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRoutePlan {

    @ProblemFactCollectionProperty
    @ValueRangeProvider(id = "truckRange")
    private List<TruckNode> trucks;

    @PlanningEntityCollectionProperty
    @ValueRangeProvider(id = "deliveryRange")
    private List<DeliveryStop> deliveries;

    @PlanningScore
    private HardSoftScore score;
}
