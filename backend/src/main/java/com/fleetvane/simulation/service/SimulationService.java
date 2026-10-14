package com.fleetvane.simulation.service;

import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.routing.service.OsrmRoutingService;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.tracking.entity.GpsEvent;
import com.fleetvane.tracking.repository.GpsEventRepository;
import com.fleetvane.tracking.dto.VehicleLocationEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class SimulationService {

    private static final double STEP_FRACTION = 0.08;
    private static final double ARRIVAL_EPSILON_KM = 2.0;
    private static final long TICK_DELAY_SECONDS = 2L;
    private static final long TICK_PERIOD_SECONDS = 5L;
    private static final double DEFAULT_DEMO_DISTANCE_PER_TICK_KM = 1.0;
    private static final long DEFAULT_DEMO_COMPANY_ID = 1L;

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final GpsEventRepository gpsEventRepository;
    private final OsrmRoutingService osrmRoutingService;
    private final Random random = new Random();
    @Value("${fleetvane.simulation.demo-distance-per-tick-km:1.0}")
    private double demoDistancePerTickKm = DEFAULT_DEMO_DISTANCE_PER_TICK_KM;
    @Value("${fleetvane.simulation.demo-company-id:1}")
    private long demoCompanyId = DEFAULT_DEMO_COMPANY_ID;

    private final Map<Long, List<double[]>> vehiclePaths = new ConcurrentHashMap<>();
    private final Map<Long, Integer> vehiclePathIndices = new ConcurrentHashMap<>();
    private final Map<Long, Long> vehicleActiveShipment = new ConcurrentHashMap<>();

    private ScheduledExecutorService scheduler;
    private volatile boolean running = false;

    private final SimpMessagingTemplate ws;

    public SimulationService(VehicleRepository vehicleRepository,
                             ShipmentRepository shipmentRepository,
                             GpsEventRepository gpsEventRepository) {
        this(vehicleRepository, null, shipmentRepository, gpsEventRepository, null, null);
    }

    @Autowired
    public SimulationService(VehicleRepository vehicleRepository,
                             @Autowired(required = false) UserRepository userRepository,
                             ShipmentRepository shipmentRepository,
                             GpsEventRepository gpsEventRepository,
                             @Autowired(required = false) OsrmRoutingService osrmRoutingService,
                             @Autowired(required = false) SimpMessagingTemplate ws) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.shipmentRepository = shipmentRepository;
        this.gpsEventRepository = gpsEventRepository;
        this.osrmRoutingService = osrmRoutingService;
        this.ws = ws;
    }

    /**
     * Starts continuous simulated movement: seeds demo shipments once, then
     * advances vehicles every {@value TICK_PERIOD_SECONDS}s until stopped.
     * Idempotent: calling start while already running is a no-op.
     */
    public synchronized void start() {
        if (running) return;
        start(Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "simulation-ticker");
            t.setDaemon(true);
            return t;
        }));
    }

    /** Testable seam: injects the scheduler instead of creating one. */
    synchronized void start(ScheduledExecutorService executor) {
        if (running) return;
        int seeded = seedDemoData();
        executor.scheduleAtFixedRate(this::tickSafely,
                TICK_DELAY_SECONDS, TICK_PERIOD_SECONDS, TimeUnit.SECONDS);
        this.scheduler = executor;
        this.running = true;
    }

    /** Idempotent stop: shuts the ticker down and halts movement. */
    public synchronized void stop() {
        if (!running) return;
        if (scheduler != null) scheduler.shutdownNow();
        scheduler = null;
        vehiclePaths.clear();
        vehiclePathIndices.clear();
        vehicleActiveShipment.clear();
        running = false;
    }

    public boolean isRunning() {
        return running;
    }

    private void tickSafely() {
        try {
            advanceVehicles();
        } catch (Exception e) {
            // A tick failure must never kill the ticker; next tick retries.
        }
    }

    @Transactional
    public int seedDemoData() {
        User demoClient = userRepository == null
                ? null
                : userRepository.findFirstByCompanyIdAndRole(demoCompanyId, "CLIENT").orElse(null);
        if (userRepository != null && demoClient == null) {
            return 0;
        }
        List<Vehicle> vehicles = vehicleRepository.findAll();
        int created = 0;
        for (Vehicle vehicle : vehicles) {
            if (!isDemoVehicle(vehicle) || vehicle.getLat() == null || vehicle.getLng() == null) {
                continue;
            }
            boolean alreadyActive = shipmentRepository
                    .findByVehicleIdAndStatusIn(vehicle.getId(), List.of("ASSIGNED", "IN_TRANSIT"))
                    .isEmpty() == false;
            if (alreadyActive) {
                continue;
            }
            Shipment shipment = new Shipment();
            shipment.setClientId(demoClient == null ? 1L : demoClient.getId());
            shipment.setStatus("IN_TRANSIT");
            shipment.setVehicleId(vehicle.getId());
            shipment.setOriginAddress("Depot");
            shipment.setDestinationAddress("Destination " + vehicle.getPlateNumber());
            shipment.setPickupLatitude(vehicle.getLat());
            shipment.setPickupLongitude(vehicle.getLng());
            shipment.setDeliveryLatitude(vehicle.getLat() + 0.5 + random.nextDouble());
            shipment.setDeliveryLongitude(vehicle.getLng() + 0.5 + random.nextDouble());
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
            // Simulation is deliberately limited to the seeded demo company.
            if (!isDemoVehicle(vehicle)) {
                continue;
            }

            List<Shipment> active = shipmentRepository
                    .findByVehicleIdAndStatusIn(vehicle.getId(), List.of("ASSIGNED", "IN_TRANSIT"));
            if (active.isEmpty()) {
                continue;
            }
            Shipment target = active.get(0);
            if (target.getDeliveryLatitude() == null || target.getDeliveryLongitude() == null) {
                continue;
            }

            double[] next;
            double heading;
            double distanceKm = haversineKm(vehicle.getLat(), vehicle.getLng(),
                    target.getDeliveryLatitude(), target.getDeliveryLongitude());

            List<double[]> path = getOrComputeRoadPath(vehicle, target);
            if (path != null && !path.isEmpty()) {
                int currentIndex = vehiclePathIndices.getOrDefault(vehicle.getId(), 0);
                int nextIndex = advancePathIndex(path, currentIndex, demoDistancePerTickKm);
                vehiclePathIndices.put(vehicle.getId(), nextIndex);
                next = path.get(nextIndex);
                heading = bearing(vehicle.getLat(), vehicle.getLng(), next[0], next[1]);
                if (nextIndex >= path.size() - 1) {
                    distanceKm = 0.0;
                }
            } else {
                next = stepToward(
                        vehicle.getLat(), vehicle.getLng(),
                        target.getDeliveryLatitude(), target.getDeliveryLongitude(),
                        STEP_FRACTION
                );
                heading = bearing(vehicle.getLat(), vehicle.getLng(),
                        target.getDeliveryLatitude(), target.getDeliveryLongitude());
            }

            double speedMps = Math.max(0, distanceKm > ARRIVAL_EPSILON_KM ? 15.0 + random.nextDouble() * 5 : 0.0);

            vehicle.setLat(next[0]);
            vehicle.setLng(next[1]);
            vehicle.setHeading(heading);
            vehicleRepository.save(vehicle);

            gpsEventRepository.save(new GpsEvent(
                    vehicle.getId(), next[0], next[1], heading, speedMps
            ));

            // Real-time WebSocket telemetry broadcast to manager live-map and client tracking
            if (ws != null) {
                try {
                    VehicleLocationEvent event = new VehicleLocationEvent(
                            vehicle.getId(),
                            vehicle.getPlateNumber(),
                            next[0],
                            next[1],
                            heading,
                            speedMps,
                            vehicle.getStatus(),
                            target.getId()
                    );
                    ws.convertAndSend("/topic/fleet.vehicles", event);
                    ws.convertAndSend("/topic/shipment." + target.getId() + ".tracking", event);
                } catch (Exception ignored) {}
            }

            if (distanceKm <= ARRIVAL_EPSILON_KM) {
                target.setStatus("DELIVERED");
                target.setDeliveredAt(Instant.now());
                shipmentRepository.save(target);

                // Auto-transition to next available pending shipment or seamless return trip so vehicles never stall
                List<Shipment> pending = shipmentRepository.findByStatus("REQUESTED");
                if (!pending.isEmpty()) {
                    Shipment nextShipment = pending.get(0);
                    nextShipment.setStatus("IN_TRANSIT");
                    nextShipment.setVehicleId(vehicle.getId());
                    nextShipment.setDriverId(target.getDriverId());
                    nextShipment.setPickedUpAt(Instant.now());
                    shipmentRepository.save(nextShipment);
                    vehicle.setStatus("IN_USE");
                } else {
                    Shipment returnLeg = new Shipment();
                    returnLeg.setClientId(target.getClientId());
                    returnLeg.setTransportCompanyId(target.getTransportCompanyId());
                    returnLeg.setStatus("IN_TRANSIT");
                    returnLeg.setVehicleId(vehicle.getId());
                    returnLeg.setDriverId(target.getDriverId());
                    returnLeg.setOriginAddress(target.getDestinationAddress());
                    returnLeg.setPickupLatitude(target.getDeliveryLatitude());
                    returnLeg.setPickupLongitude(target.getDeliveryLongitude());
                    returnLeg.setDestinationAddress(target.getOriginAddress());
                    returnLeg.setDeliveryLatitude(target.getPickupLatitude());
                    returnLeg.setDeliveryLongitude(target.getPickupLongitude());
                    returnLeg.setWeight(target.getWeight() != null ? target.getWeight() : 500.0);
                    returnLeg.setCategory(target.getCategory() != null ? target.getCategory() : "General Freight");
                    returnLeg.setPickedUpAt(Instant.now());
                    shipmentRepository.save(returnLeg);
                    vehicle.setStatus("IN_USE");
                }
                vehicleRepository.save(vehicle);
                vehiclePaths.remove(vehicle.getId());
                vehiclePathIndices.remove(vehicle.getId());
                vehicleActiveShipment.remove(vehicle.getId());
                if (ws != null) {
                    try {
                        ws.convertAndSend("/topic/shipment." + target.getId() + ".tracking", "Shipment #" + target.getId() + " DELIVERED.");
                    } catch (Exception ignored) {}
                }
            }

            moved++;
        }
        return moved;
    }

    private boolean isDemoVehicle(Vehicle vehicle) {
        return vehicle.getCompanyId() != null && vehicle.getCompanyId().equals(demoCompanyId);
    }

    private List<double[]> getOrComputeRoadPath(Vehicle vehicle, Shipment target) {
        if (osrmRoutingService == null) {
            return null;
        }
        Long cachedShipment = vehicleActiveShipment.get(vehicle.getId());
        if (cachedShipment != null && cachedShipment.equals(target.getId()) && vehiclePaths.containsKey(vehicle.getId())) {
            return vehiclePaths.get(vehicle.getId());
        }
        try {
            List<double[]> waypoints = List.of(
                    new double[]{vehicle.getLat(), vehicle.getLng()},
                    new double[]{target.getDeliveryLatitude(), target.getDeliveryLongitude()}
            );
            OsrmRoutingService.RouteResult res = osrmRoutingService.getRoute(waypoints);
            if (res != null && res.geometry() != null && res.geometry().size() > 1) {
                vehiclePaths.put(vehicle.getId(), res.geometry());
                vehiclePathIndices.put(vehicle.getId(), 0);
                vehicleActiveShipment.put(vehicle.getId(), target.getId());
                return res.geometry();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private double[] stepToward(double lat1, double lng1, double lat2, double lng2, double fraction) {
        return new double[]{
                lat1 + (lat2 - lat1) * fraction,
                lng1 + (lng2 - lng1) * fraction
        };
    }

    private int advancePathIndex(List<double[]> path, int currentIndex, double distanceKm) {
        double travelledKm = 0.0;
        int nextIndex = currentIndex;
        while (nextIndex < path.size() - 1 && travelledKm < distanceKm) {
            double[] from = path.get(nextIndex);
            double[] to = path.get(nextIndex + 1);
            travelledKm += haversineKm(from[0], from[1], to[0], to[1]);
            nextIndex++;
        }
        return nextIndex;
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
