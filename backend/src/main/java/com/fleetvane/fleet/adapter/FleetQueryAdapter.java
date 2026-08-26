package com.fleetvane.fleet.adapter;

import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.routing.application.FleetQueryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class FleetQueryAdapter implements FleetQueryPort {

    private final VehicleRepository vehicleRepository;

    public FleetQueryAdapter(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public List<VehicleData> findAllById(List<Long> vehicleIds) {
        return vehicleRepository.findAllById(vehicleIds).stream()
                .map(this::toData)
                .collect(Collectors.toList());
    }

    private VehicleData toData(Vehicle vehicle) {
        long capacityGrams = vehicle.getCapacity() != null ? (long) (vehicle.getCapacity() * 1000) : 0L;
        long volumeM3x1000 = vehicle.getMaxVolumeM3() != null ? (long) (vehicle.getMaxVolumeM3() * 1000) : 0L;
        return new VehicleData(
                vehicle.getId(),
                vehicle.getId(),
                vehicle.getLat(),
                vehicle.getLng(),
                capacityGrams,
                volumeM3x1000
        );
    }
}
