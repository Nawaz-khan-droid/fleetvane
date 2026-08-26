package com.fleetvane.routing.domain;

import ai.timefold.solver.core.api.score.buildin.hardsoftlong.HardSoftLongScore;
import ai.timefold.solver.core.api.score.stream.Constraint;
import ai.timefold.solver.core.api.score.stream.ConstraintFactory;
import ai.timefold.solver.core.api.score.stream.ConstraintProvider;

public class RouteConstraintProvider implements ConstraintProvider {

    @Override
    public Constraint[] defineConstraints(ConstraintFactory factory) {
        return new Constraint[]{
                vehicleCapacity(factory),
                vehicleVolume(factory),
                minimizeDistance(factory)
        };
    }

    protected Constraint vehicleCapacity(ConstraintFactory factory) {
        return factory.forEach(RouteVehicle.class)
                .filter(vehicle -> {
                    long totalDemand = vehicle.getStops().stream()
                            .mapToLong(DeliveryStop::getDemandGrams)
                            .sum();
                    return totalDemand > vehicle.getCapacityGrams();
                })
                .penalizeLong(HardSoftLongScore.ONE_HARD,
                        vehicle -> {
                            long totalDemand = vehicle.getStops().stream()
                                    .mapToLong(DeliveryStop::getDemandGrams)
                                    .sum();
                            return totalDemand - vehicle.getCapacityGrams();
                        })
                .asConstraint("vehicleCapacity");
    }

    protected Constraint vehicleVolume(ConstraintFactory factory) {
        return factory.forEach(RouteVehicle.class)
                .filter(vehicle -> {
                    if (vehicle.getVolumeCapacity() == null || vehicle.getVolumeCapacity() == 0) return false;
                    long totalVolume = vehicle.getStops().stream()
                            .mapToLong(DeliveryStop::getVolumeDemand)
                            .sum();
                    return totalVolume > vehicle.getVolumeCapacity();
                })
                .penalizeLong(HardSoftLongScore.ONE_HARD,
                        vehicle -> {
                            long totalVolume = vehicle.getStops().stream()
                                    .mapToLong(DeliveryStop::getVolumeDemand)
                                    .sum();
                            return totalVolume - vehicle.getVolumeCapacity();
                        })
                .asConstraint("vehicleVolume");
    }

    protected Constraint minimizeDistance(ConstraintFactory factory) {
        return factory.forEach(RouteVehicle.class)
                .penalizeLong(HardSoftLongScore.ONE_SOFT,
                        vehicle -> {
                            double distance = 0.0;
                            Double prevLat = vehicle.getLat();
                            Double prevLng = vehicle.getLng();

                            for (DeliveryStop stop : vehicle.getStops()) {
                                distance += calculateHaversineDistance(prevLat, prevLng, stop.getLat(), stop.getLng());
                                prevLat = stop.getLat();
                                prevLng = stop.getLng();
                            }
                            return (long) (distance * 1000);
                        })
                .asConstraint("minimizeDistance");
    }

    private double calculateHaversineDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return 0.0;
        }
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
