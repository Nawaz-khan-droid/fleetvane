package com.fleetvane.solver;

import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.Constraint;
import ai.timefold.solver.core.api.score.stream.ConstraintFactory;
import ai.timefold.solver.core.api.score.stream.ConstraintProvider;

public class RouteConstraintProvider implements ConstraintProvider {

    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[]{
                minimizeDistance(factory)
        };
    }

    private Constraint minimizeDistance(ConstraintFactory factory) {
        return factory.forEach(DeliveryStop.class)
                .filter(stop -> stop.getPreviousStop() != null)
                .penalize(HardSoftScore.ONE_SOFT,
                        stop -> calculateDistance(stop.getPreviousStop(), stop))
                .asConstraint("Minimize distance between stops");
    }

    private int calculateDistance(RouteNode from, RouteNode to) {
        if (from == null || to == null) return 0;
        if (from.getLat() == null || from.getLng() == null || to.getLat() == null || to.getLng() == null) return 0;
        
        double earthRadius = 6371000; // meters
        double dLat = Math.toRadians(to.getLat() - from.getLat());
        double dLng = Math.toRadians(to.getLng() - from.getLng());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(from.getLat())) * Math.cos(Math.toRadians(to.getLat())) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (int) (earthRadius * c);
    }
}
