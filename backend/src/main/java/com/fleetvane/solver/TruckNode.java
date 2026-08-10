package com.fleetvane.solver;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ai.timefold.solver.core.api.domain.lookup.PlanningId;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TruckNode implements RouteNode {
    @PlanningId
    private Long id;
    
    private Double lat;
    private Double lng;
}
