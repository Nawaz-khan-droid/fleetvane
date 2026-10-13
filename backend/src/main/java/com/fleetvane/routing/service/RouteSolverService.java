package com.fleetvane.routing.service;

import com.fleetvane.routing.application.FleetQueryPort;
import com.fleetvane.routing.application.ShipmentQueryPort;
import com.fleetvane.routing.dto.CreateOptimizationJobRequest;
import com.fleetvane.routing.dto.OptimizationJobDto;
import com.fleetvane.routing.dto.RouteSolutionResponse;
import com.fleetvane.routing.entity.OptimizationJob;
import com.fleetvane.routing.repository.OptimizationJobRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RouteSolverService {

    private static final Logger log = LoggerFactory.getLogger(RouteSolverService.class);

    private final OsrmRoutingService osrmRoutingService;
    private final OptimizationJobRepository jobRepository;
    private final FleetQueryPort fleetQueryPort;
    private final ShipmentQueryPort shipmentQueryPort;

    public RouteSolverService(OsrmRoutingService osrmRoutingService,
                              OptimizationJobRepository jobRepository,
                              FleetQueryPort fleetQueryPort,
                              ShipmentQueryPort shipmentQueryPort) {
        this.osrmRoutingService = osrmRoutingService;
        this.jobRepository = jobRepository;
        this.fleetQueryPort = fleetQueryPort;
        this.shipmentQueryPort = shipmentQueryPort;
    }

    /** Synchronous contract ceiling — keeps the blocking window inside HTTP timeout territory. */
    static final int MAX_VEHICLES = 50;
    static final int MAX_SHIPMENTS = 200;

    public RouteSolutionResponse solveSync(CreateOptimizationJobRequest request, Long userId) {
        // Fail-fast FIRST: reject oversized problems before any database I/O
        if (request.vehicleIds().size() > MAX_VEHICLES || request.shipmentIds().size() > MAX_SHIPMENTS) {
            throw new BusinessException(
                    "Problem size exceeds synchronous solve limit (max " + MAX_VEHICLES +
                    " vehicles / " + MAX_SHIPMENTS + " shipments)",
                    HttpStatus.BAD_REQUEST);
        }

        List<FleetQueryPort.VehicleData> vehicleData =
                fleetQueryPort.findAllById(request.vehicleIds());
        List<ShipmentQueryPort.ShipmentData> shipmentData =
                shipmentQueryPort.findAllById(request.shipmentIds());

        if (vehicleData.isEmpty() || shipmentData.isEmpty()) {
            throw new BusinessException("Must provide valid vehicles and shipments", HttpStatus.BAD_REQUEST);
        }

        List<ShipmentQueryPort.ShipmentData> solvable = shipmentData.stream()
                .filter(s -> s.deliveryLatitude() != null && s.deliveryLongitude() != null)
                .toList();
        int skippedMissingCoords = shipmentData.size() - solvable.size();
        if (skippedMissingCoords > 0) {
            log.warn("Optimization job: skipping {} shipment(s) without destination coordinates", skippedMissingCoords);
        }
        if (solvable.isEmpty()) {
            throw new BusinessException(
                "Selected shipments have no destination coordinates. Attach pickup/drop locations before optimizing.",
                HttpStatus.BAD_REQUEST);
        }

        OptimizationJob job = new OptimizationJob();
        job.setId(UUID.randomUUID());
        job.setStatus("SOLVING");
        job.setRequestedBy(userId);
        job.setCreatedAt(Instant.now());
        job.setStartedAt(Instant.now());
        jobRepository.save(job);

        try {
            List<RouteSolutionResponse.VehicleRoute> routes = planRoutes(vehicleData, solvable);

            double totalDistanceMeters = routes.stream()
                    .mapToDouble(r -> r.distanceMeters() != null ? r.distanceMeters() : 0.0)
                    .sum();
            String scoreString = "0hard/-" + Math.round(totalDistanceMeters) + "soft";

            job.setStatus("SOLVED");
            job.setScore(scoreString);
            job.setCompletedAt(Instant.now());
            job.setResultJson(serializeResult(routes));
            jobRepository.save(job);

            return new RouteSolutionResponse(job.getId(), job.getStatus(), job.getScore(), routes);
        } catch (Exception ex) {
            job.setStatus("FAILED");
            job.setErrorMessage(ex.getMessage());
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
            throw new BusinessException("Route solving failed: " + ex.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Multi-Vehicle Nearest-Neighbor tour builder + OSRM road network geometry.
     */
    private List<RouteSolutionResponse.VehicleRoute> planRoutes(
            List<FleetQueryPort.VehicleData> vehicles,
            List<ShipmentQueryPort.ShipmentData> shipments) {

        // 1. Group shipments to nearest vehicle based on vehicle depot location
        Map<Long, List<ShipmentQueryPort.ShipmentData>> assignments = new LinkedHashMap<>();
        for (FleetQueryPort.VehicleData v : vehicles) {
            assignments.put(v.id(), new ArrayList<>());
        }

        for (ShipmentQueryPort.ShipmentData shipment : shipments) {
            FleetQueryPort.VehicleData closestVehicle = vehicles.get(0);
            double minDistance = Double.MAX_VALUE;

            for (FleetQueryPort.VehicleData v : vehicles) {
                double dist = OsrmRoutingService.haversineMeters(
                        v.lat(), v.lng(), shipment.deliveryLatitude(), shipment.deliveryLongitude());
                if (dist < minDistance) {
                    minDistance = dist;
                    closestVehicle = v;
                }
            }
            assignments.get(closestVehicle.id()).add(shipment);
        }

        // 2. For each vehicle, order its assigned shipments using Nearest-Neighbor heuristic
        List<RouteSolutionResponse.VehicleRoute> routes = new ArrayList<>();

        for (FleetQueryPort.VehicleData v : vehicles) {
            List<ShipmentQueryPort.ShipmentData> unvisited = new ArrayList<>(assignments.get(v.id()));
            List<ShipmentQueryPort.ShipmentData> orderedStops = new ArrayList<>();

            double currentLat = v.lat();
            double currentLng = v.lng();

            while (!unvisited.isEmpty()) {
                ShipmentQueryPort.ShipmentData nextStop = null;
                double bestDist = Double.MAX_VALUE;

                for (ShipmentQueryPort.ShipmentData candidate : unvisited) {
                    double dist = OsrmRoutingService.haversineMeters(
                            currentLat, currentLng, candidate.deliveryLatitude(), candidate.deliveryLongitude());
                    if (dist < bestDist) {
                        bestDist = dist;
                        nextStop = candidate;
                    }
                }

                if (nextStop != null) {
                    orderedStops.add(nextStop);
                    unvisited.remove(nextStop);
                    currentLat = nextStop.deliveryLatitude();
                    currentLng = nextStop.deliveryLongitude();
                }
            }

            // 3. Build waypoints for OSRM: [Vehicle Start] -> [Stop 1] -> [Stop 2] ...
            List<double[]> waypoints = new ArrayList<>();
            waypoints.add(new double[]{v.lat(), v.lng()});

            List<RouteSolutionResponse.Stop> responseStops = new ArrayList<>();
            for (ShipmentQueryPort.ShipmentData s : orderedStops) {
                waypoints.add(new double[]{s.deliveryLatitude(), s.deliveryLongitude()});
                responseStops.add(new RouteSolutionResponse.Stop(s.id(), s.deliveryLatitude(), s.deliveryLongitude()));
            }

            // 4. Fetch real road geometry from OSRM
            OsrmRoutingService.RouteResult routeResult = osrmRoutingService.getRoute(waypoints);

            routes.add(new RouteSolutionResponse.VehicleRoute(
                    v.id(),
                    v.originalId(),
                    v.lat(),
                    v.lng(),
                    responseStops,
                    routeResult.geometry(),
                    routeResult.distanceMeters(),
                    routeResult.durationSeconds()
            ));
        }

        return routes;
    }

    private String serializeResult(List<RouteSolutionResponse.VehicleRoute> routes) {
        StringBuilder sb = new StringBuilder("{\"routes\":[");
        for (int i = 0; i < routes.size(); i++) {
            RouteSolutionResponse.VehicleRoute v = routes.get(i);
            sb.append("{\"vehicleId\":").append(v.vehicleId()).append(",\"stops\":[");
            for (int j = 0; j < v.stops().size(); j++) {
                if (j > 0) sb.append(',');
                sb.append(v.stops().get(j).shipmentId());
            }
            sb.append("]}");
            if (i < routes.size() - 1) sb.append(',');
        }
        return sb.append("]}").toString();
    }

    @Transactional(readOnly = true)
    public OptimizationJobDto getJobStatus(UUID jobId) {
        OptimizationJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("OptimizationJob", "id", jobId));

        return new OptimizationJobDto(
                job.getId(),
                job.getStatus(),
                job.getRequestedBy(),
                job.getScore(),
                job.getErrorMessage(),
                job.getResultJson(),
                job.getCreatedAt(),
                job.getStartedAt(),
                job.getCompletedAt()
        );
    }
}
