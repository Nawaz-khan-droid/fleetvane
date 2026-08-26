package com.fleetvane.routing.service;

import ai.timefold.solver.core.api.solver.SolverManager;
import com.fleetvane.routing.application.FleetQueryPort;
import com.fleetvane.routing.application.ShipmentQueryPort;
import com.fleetvane.routing.domain.DeliveryStop;
import org.springframework.stereotype.Service;
import com.fleetvane.routing.domain.RouteVehicle;
import com.fleetvane.routing.domain.VehicleRoutePlan;
import com.fleetvane.routing.dto.CreateOptimizationJobRequest;
import com.fleetvane.routing.dto.OptimizationJobDto;
import com.fleetvane.routing.dto.RouteSolutionResponse;
import com.fleetvane.routing.entity.OptimizationJob;
import com.fleetvane.routing.repository.OptimizationJobRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RouteSolverService {

    private final SolverManager<VehicleRoutePlan, UUID> solverManager;
    private final OptimizationJobRepository jobRepository;
    private final FleetQueryPort fleetQueryPort;
    private final ShipmentQueryPort shipmentQueryPort;

    public RouteSolverService(SolverManager<VehicleRoutePlan, UUID> solverManager,
                              OptimizationJobRepository jobRepository,
                              FleetQueryPort fleetQueryPort,
                              ShipmentQueryPort shipmentQueryPort) {
        this.solverManager = solverManager;
        this.jobRepository = jobRepository;
        this.fleetQueryPort = fleetQueryPort;
        this.shipmentQueryPort = shipmentQueryPort;
    }

    /**
     * Track B synchronous lifecycle: blocks on the request thread until Timefold
     * reaches its termination limit (application.yml -> timefold.solver.termination.spent-limit),
     * persists the result, and returns solved COORDINATES directly in the response.
     * No WebSocket, no broker, no publish/subscribe race.
     */
    /** Synchronous contract ceiling — keeps the blocking window inside HTTP timeout territory. */
    static final int MAX_VEHICLES = 50;
    static final int MAX_SHIPMENTS = 200;

    @Transactional
    public RouteSolutionResponse solveSync(CreateOptimizationJobRequest request, Long userId) {
        // Fail-fast FIRST: reject oversized problems before any database I/O,
        // so a hostile/buggy request cannot force huge IN-clause queries.
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

        List<RouteVehicle> routeVehicles = vehicleData.stream()
                .map(v -> new RouteVehicle(v.id(), v.originalId(), v.lat(), v.lng(), v.capacityGrams()))
                .collect(Collectors.toList());

        List<DeliveryStop> deliveryStops = shipmentData.stream()
                .map(s -> new DeliveryStop(s.id(), s.id(), s.destinationLat(), s.destinationLng(), s.weightGrams()))
                .collect(Collectors.toList());

        OptimizationJob job = new OptimizationJob();
        job.setId(UUID.randomUUID());
        job.setStatus("SOLVING");
        job.setRequestedBy(userId);
        job.setCreatedAt(Instant.now());
        job.setStartedAt(Instant.now());
        jobRepository.save(job);

        VehicleRoutePlan problem = new VehicleRoutePlan(job.getId(), deliveryStops, routeVehicles);

        VehicleRoutePlan solution;
        try {
            // BLOCKS on the request thread until the configured spent-limit termination fires.
            solution = solverManager.solve(job.getId(), problem).getFinalBestSolution();
        } catch (Exception ex) {
            job.setStatus("FAILED");
            job.setErrorMessage(ex.getMessage());
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
            throw new BusinessException("Route solving failed: " + ex.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        job.setStatus("SOLVED");
        job.setScore(solution.getScore() != null ? solution.getScore().toString() : null);
        job.setCompletedAt(Instant.now());
        job.setResultJson(serializeResult(solution));
        jobRepository.save(job);

        return buildResponse(solution, vehicleData, shipmentData, job);
    }

    private RouteSolutionResponse buildResponse(VehicleRoutePlan solution,
                                                List<FleetQueryPort.VehicleData> vehicleData,
                                                List<ShipmentQueryPort.ShipmentData> shipmentData,
                                                OptimizationJob job) {
        Map<Long, FleetQueryPort.VehicleData> vehiclesById = vehicleData.stream()
                .collect(Collectors.toMap(FleetQueryPort.VehicleData::id, Function.identity()));
        Map<Long, ShipmentQueryPort.ShipmentData> shipmentsById = shipmentData.stream()
                .collect(Collectors.toMap(ShipmentQueryPort.ShipmentData::id, Function.identity()));

        List<RouteSolutionResponse.VehicleRoute> routes = new ArrayList<>();
        for (RouteVehicle v : solution.getVehicles()) {
            FleetQueryPort.VehicleData vd = vehiclesById.get(v.getVehicleId());
            if (vd == null) continue;

            List<RouteSolutionResponse.Stop> stops = new ArrayList<>();
            for (DeliveryStop s : v.getStops()) {
                ShipmentQueryPort.ShipmentData sd = shipmentsById.get(s.getShipmentId());
                if (sd != null) {
                    stops.add(new RouteSolutionResponse.Stop(sd.id(), sd.destinationLat(), sd.destinationLng()));
                }
            }
            routes.add(new RouteSolutionResponse.VehicleRoute(
                    vd.id(), vd.originalId(), vd.lat(), vd.lng(), stops));
        }

        return new RouteSolutionResponse(job.getId(), job.getStatus(), job.getScore(), routes);
    }

    /** Audit/history persistence only — the HTTP response is now typed JSON. */
    private String serializeResult(VehicleRoutePlan solution) {
        StringBuilder sb = new StringBuilder("{\"routes\":[");
        for (int i = 0; i < solution.getVehicles().size(); i++) {
            RouteVehicle v = solution.getVehicles().get(i);
            sb.append("{\"vehicleId\":").append(v.getVehicleId()).append(",\"stops\":[");
            for (int j = 0; j < v.getStops().size(); j++) {
                if (j > 0) sb.append(',');
                sb.append(v.getStops().get(j).getShipmentId());
            }
            sb.append("]}");
            if (i < solution.getVehicles().size() - 1) sb.append(',');
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
