package com.fleetvane.routing.service;

import ai.timefold.solver.core.api.solver.SolverManager;
import ai.timefold.solver.core.api.solver.SolverStatus;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.routing.domain.DeliveryStop;
import com.fleetvane.routing.domain.RouteVehicle;
import com.fleetvane.routing.domain.VehicleRoutePlan;
import com.fleetvane.routing.dto.CreateOptimizationJobRequest;
import com.fleetvane.routing.dto.OptimizationJobDto;
import com.fleetvane.routing.entity.OptimizationJob;
import com.fleetvane.routing.repository.OptimizationJobRepository;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RouteSolverService {

    private final SolverManager<VehicleRoutePlan, UUID> solverManager;
    private final OptimizationJobRepository jobRepository;
    private final VehicleRepository vehicleRepository;
    private final ShipmentRepository shipmentRepository;

    public RouteSolverService(SolverManager<VehicleRoutePlan, UUID> solverManager,
                              OptimizationJobRepository jobRepository,
                              VehicleRepository vehicleRepository,
                              ShipmentRepository shipmentRepository) {
        this.solverManager = solverManager;
        this.jobRepository = jobRepository;
        this.vehicleRepository = vehicleRepository;
        this.shipmentRepository = shipmentRepository;
    }

    @Transactional
    public OptimizationJobDto submitJob(CreateOptimizationJobRequest request, Long userId) {
        List<Vehicle> vehicles = vehicleRepository.findAllById(request.vehicleIds());
        List<Shipment> shipments = shipmentRepository.findAllById(request.shipmentIds());

        if (vehicles.isEmpty() || shipments.isEmpty()) {
            throw new BusinessException("Must provide valid vehicles and shipments", HttpStatus.BAD_REQUEST);
        }

        List<RouteVehicle> routeVehicles = vehicles.stream()
                .map(v -> new RouteVehicle(v.getId(), v.getId(), v.getLat(), v.getLng(), (long) (v.getCapacity() * 1000)))
                .collect(Collectors.toList());

        List<DeliveryStop> deliveryStops = shipments.stream()
                .map(s -> new DeliveryStop(s.getId(), s.getId(), s.getDestinationLat(), s.getDestinationLng(), (long) (s.getWeight() * 1000)))
                .collect(Collectors.toList());

        OptimizationJob job = new OptimizationJob();
        job.setId(UUID.randomUUID());
        job.setStatus("SOLVING");
        job.setRequestedBy(userId);
        job.setCreatedAt(Instant.now());
        job.setStartedAt(Instant.now());
        
        jobRepository.save(job);

        VehicleRoutePlan problem = new VehicleRoutePlan(job.getId(), deliveryStops, routeVehicles);
        
        // Submit to Timefold async
        solverManager.solveAndListen(job.getId(),
                id -> problem,
                this::saveSolution,
                (id, exception) -> {
                    OptimizationJob failedJob = jobRepository.findById(id).orElse(null);
                    if (failedJob != null) {
                        failedJob.setStatus("FAILED");
                        failedJob.setErrorMessage(exception.getMessage());
                        failedJob.setCompletedAt(Instant.now());
                        jobRepository.save(failedJob);
                    }
                }
        );

        return mapToDto(job);
    }

    @Transactional
    protected void saveSolution(VehicleRoutePlan solution) {
        OptimizationJob job = jobRepository.findById(solution.getId()).orElse(null);
        if (job == null) return;
        
        job.setStatus("SOLVED");
        job.setScore(solution.getScore() != null ? solution.getScore().toString() : null);
        job.setCompletedAt(Instant.now());
        
        // Very simple JSON building for capstone
        StringBuilder jsonBuilder = new StringBuilder();
        jsonBuilder.append("{\"routes\": [");
        
        for (int i = 0; i < solution.getVehicles().size(); i++) {
            RouteVehicle v = solution.getVehicles().get(i);
            jsonBuilder.append("{\"vehicleId\": ").append(v.getVehicleId()).append(", \"stops\": [");
            
            for (int j = 0; j < v.getStops().size(); j++) {
                DeliveryStop s = v.getStops().get(j);
                jsonBuilder.append(s.getShipmentId());
                if (j < v.getStops().size() - 1) jsonBuilder.append(", ");
            }
            jsonBuilder.append("]}");
            if (i < solution.getVehicles().size() - 1) jsonBuilder.append(", ");
        }
        jsonBuilder.append("]}");
        
        job.setResultJson(jsonBuilder.toString());
        jobRepository.save(job);
    }

    @Transactional(readOnly = true)
    public OptimizationJobDto getJobStatus(UUID jobId) {
        OptimizationJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("OptimizationJob", "id", jobId));
        
        // Sync Timefold status with DB if still solving
        if ("SOLVING".equals(job.getStatus())) {
            SolverStatus status = solverManager.getSolverStatus(jobId);
            if (status == SolverStatus.NOT_SOLVING) {
                // It finished but listener hasn't saved yet, or it failed
                // Let's just return what DB has, listener is async
            }
        }
        
        return mapToDto(job);
    }

    private OptimizationJobDto mapToDto(OptimizationJob job) {
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
