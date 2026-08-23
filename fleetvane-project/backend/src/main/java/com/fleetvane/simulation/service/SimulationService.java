package com.fleetvane.simulation.service;

import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.tracking.entity.GpsEvent;
import com.fleetvane.tracking.repository.GpsEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Random;

@Service
public class SimulationService {

    private static final double STEP_FRACTION = 0.08;
    private static final double ARRIVAL_EPSILON_KM = 2.0;

    private final VehicleRepository vehicleRepository;
    private final ShipmentRepository shipmentRepository;
    private final GpsEventRepository gpsEventRepository;
    private final Random random = new Random();

    public SimulationService(VehicleRepository vehicleRepository,
                             ShipmentRepository shipmentRepository,
                             GpsEventRepository gpsEventRepository) {
        this.vehicleRepository = vehicleRepository;
        this.shipmentRepository = shipmentRepository;
        this.gpsEventRepository = gpsEventRepository;
    }

    @Transactional
    public int seedDemoData() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        int created = 0;
        for (Vehicle vehicle : vehicles) {
            boolean alreadyActive = shipmentRepository
                    .findByVehicleIdAndStatusIn(vehicle.getId(), List.of("ASSIGNED", "IN_TRANSIT"))
                    .isEmpty() == false;
            if (alreadyActive) {
                continue;
            }
            Shipment shipment = new Shipment();
            shipment.setClientId(1L);
            shipment.setStatus("IN_TRANSIT");
            shipment.setVehicleId(vehicle.getId());
            shipment.setOriginAddress("Depot");
            shipment.setDestinationAddress("Destination " + vehicle.getPlateNumber());
            shipment.setOriginLat(vehicle.getLat());
            shipment.setOriginLng(vehicle.getLng());
            shipment.setDestinationLat(vehicle.getLat() + 0.5 + random.nextDouble());
            shipment.setDestinationLng(vehicle.getLng() + 0.5 + random.nextDouble());
            shipment.setWeight(500.0 + random.nextInt(9000));
            shipment.setPickedUpAt(Instant.now());
            shipmentRepository.save(shipment);
            created++;
        }
        return created;
    }

    @Transactional
    public int advanceVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        int moved = 0;
        for (Vehicle vehicle : vehicles) {
            List<Shipment> active = shipmentRepository
                    .findByVehicleIdAndStatusIn(vehicle.getId(), List.of("ASSIGNED", "IN_TRANSIT"));
            if (active.isEmpty()) {
                continue;
            }
            Shipment target = active.get(0);
            if (target.getDestinationLat() == null || target.getDestinationLng() == null) {
                continue;
            }
            double[] next = stepToward(
                    vehicle.getLat(), vehicle.getLng(),
                    target.getDestinationLat(), target.getDestinationLng(),
                    STEP_FRACTION
            );
            double heading = bearing(vehicle.getLat(), vehicle.getLng(),
                    target.getDestinationLat(), target.getDestinationLng());
            double distanceKm = haversineKm(vehicle.getLat(), vehicle.getLng(),
                    target.getDestinationLat(), target.getDestinationLng());
            double speedMps = Math.max(0, distanceKm > ARRIVAL_EPSILON_KM ? 15.0 + random.nextDouble() * 5 : 0.0);

            vehicle.setLat(next[0]);
            vehicle.setLng(next[1]);
            vehicle.setHeading(heading);
            vehicleRepository.save(vehicle);

            gpsEventRepository.save(new GpsEvent(
                    vehicle.getId(), next[0], next[1], heading, speedMps
            ));

            if (distanceKm <= ARRIVAL_EPSILON_KM) {
                target.setStatus("DELIVERED");
                target.setDeliveredAt(Instant.now());
                shipmentRepository.save(target);
            }

            moved++;
        }
        return moved;
    }

    private double[] stepToward(double lat1, double lng1, double lat2, double lng2, double fraction) {
        return new double[]{
                lat1 + (lat2 - lat1) * fraction,
                lng1 + (lng2 - lng1) * fraction
        };
    }

    private double bearing(double lat1, double lng1, double lat2, double lng2) {
        double dLng = Math.toRadians(lng2 - lng1);
        double y = Math.sin(dLng) * Math.cos(Math.toRadians(lat2));
        double x = Math.cos(Math.toRadians(lat1)) * Math.sin(Math.toRadians(lat2))
                - Math.sin(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.cos(dLng);
        double deg = Math.toDegrees(Math.atan2(y, x));
        return (deg + 360.0) % 360.0;
    }

    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
        return 6371.0 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}