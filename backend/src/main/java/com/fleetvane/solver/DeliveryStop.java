package com.fleetvane.solver;

import ai.timefold.solver.core.api.domain.entity.PlanningEntity;
import ai.timefold.solver.core.api.domain.lookup.PlanningId;
import ai.timefold.solver.core.api.domain.variable.PlanningVariable;
import ai.timefold.solver.core.api.domain.variable.PlanningVariableGraphType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fleetvane.model.Delivery;

@PlanningEntity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryStop implements RouteNode {
    
    @PlanningId
    private Long id;
    
    private Double lat;
    private Double lng;
    
    @PlanningVariable(
        valueRangeProviderRefs = {"truckRange", "deliveryRange"},
        graphType = PlanningVariableGraphType.CHAINED
    )
    private RouteNode previousStop;
    
    private Delivery delivery;
}
