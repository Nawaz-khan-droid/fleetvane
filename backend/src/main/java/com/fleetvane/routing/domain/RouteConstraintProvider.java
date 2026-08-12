package com.fleetvane.routing.domain;

import ai.timefold.solver.core.api.score.buildin.hardsoft.HardSoftScore;
import ai.timefold.solver.core.api.score.stream.Constraint;
import ai.timefold.solver.core.api.score.stream.ConstraintFactory;
import ai.timefold.solver.core.api.score.stream.ConstraintProvider;

public class RouteConstraintProvider implements ConstraintProvider {

    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[]{
                vehicleCapacity(factory),
                minimizeDistance(factory)
        };
    }

    protected Constraint vehicleCapacity(ConstraintFactory factory) {
        return factory.forEach(RouteVehicle.class)
                .filter(vehicle -> {
                    double totalDemand = vehicle.getStops().stream()
                            .mapToDouble(DeliveryStop::getDemand)
                            .sum();
                    return totalDemand > vehicle.getCapacity();
                })
                .penalize(HardSoftScore.ONE_HARD,
                        vehicle -> {
                            double totalDemand = vehicle.getStops().stream()
                                    .mapToDouble(DeliveryStop::getDemand)
                                    .sum();
                            return (int) (totalDemand - vehicle.getCapacity());
                        })
                .asConstraint("vehicleCapacity");
    }

    protected Constraint minimizeDistance(ConstraintFactory factory) {
        return factory.forEach(RouteVehicle.class)
                .penalize(HardSoftScore.ONE_SOFT,
                        vehicle -> {
                            double distance = 0.0;
                            Double prevLat = vehicle.getLat();
                            Double prevLng = vehicle.getLng();
                            
                            for (DeliveryStop stop : vehicle.getStops()) {
                                distance += calculateHaversineDistance(prevLat, prevLng, stop.getLat(), stop.getLng());
                                prevLat = stop.getLat();
                                prevLng = stop.getLng();
                            }
                            return (int) (distance * 1000); // meters
                        })
                .asConstraint("minimizeDistance");
    }
    
    // Calculate geographic distance in km
    private double calculateHaversineDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return 0.0;
        }
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
