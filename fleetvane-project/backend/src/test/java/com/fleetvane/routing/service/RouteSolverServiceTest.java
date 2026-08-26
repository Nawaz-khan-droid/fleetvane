package com.fleetvane.routing.service;

import ai.timefold.solver.core.api.solver.SolverJob;
import ai.timefold.solver.core.api.solver.SolverManager;
import com.fleetvane.routing.application.FleetQueryPort;
import com.fleetvane.routing.application.ShipmentQueryPort;
import com.fleetvane.routing.domain.DeliveryStop;
import com.fleetvane.routing.domain.RouteVehicle;
import com.fleetvane.routing.domain.VehicleRoutePlan;
import com.fleetvane.routing.dto.CreateOptimizationJobRequest;
import com.fleetvane.routing.dto.RouteSolutionResponse;
import com.fleetvane.routing.entity.OptimizationJob;
import com.fleetvane.routing.repository.OptimizationJobRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Lifecycle tests for the SYNCHRONOUS routing job:
 *
 *   creation guards ──> SOLVING (persisted) ──> SOLVED (persisted w/ result)
 *                                        └───> FAILED (persisted w/ error)
 */
@ExtendWith(MockitoExtension.class)
class RouteSolverServiceTest {

    @Mock private SolverManager<VehicleRoutePlan, UUID> solverManager;
    @Mock private SolverJob<VehicleRoutePlan, UUID> solverJob;
    @Mock private OptimizationJobRepository jobRepository;
    @Mock private FleetQueryPort fleetQueryPort;
    @Mock private ShipmentQueryPort shipmentQueryPort;

    @InjectMocks
    private RouteSolverService service;

    private CreateOptimizationJobRequest validRequest;
    private List<OptimizationJob> persistedJobs;
    /** Status captured at save()-time — the entity is mutated afterwards, so the
     *  object graph alone cannot prove the SOLVING->terminal ordering. */
    private List<String> statusTimeline;

    @BeforeEach
    void setUp() {
        validRequest = new CreateOptimizationJobRequest(List.of(10L), List.of(500L, 501L));
        persistedJobs = new ArrayList<>();
        statusTimeline = new ArrayList<>();
        // lenient(): guard-path tests intentionally never reach persistence
        lenient().when(jobRepository.save(any(OptimizationJob.class))).thenAnswer(inv -> {
            OptimizationJob job = inv.getArgument(0);
            statusTimeline.add(job.getStatus());
            persistedJobs.add(job);
            return job;
        });
    }

    // ── Fixtures ─────────────────────────────────────────────────────────────

    private void givenPortData() {
        when(fleetQueryPort.findAllById(validRequest.vehicleIds())).thenReturn(List.of(
                new FleetQueryPort.VehicleData(10L, 10L, 19.10, 72.90, 10000L)));
        when(shipmentQueryPort.findAllById(validRequest.shipmentIds())).thenReturn(List.of(
                new ShipmentQueryPort.ShipmentData(500L, 18.52, 73.85, 2000L),
                new ShipmentQueryPort.ShipmentData(501L, 18.60, 73.90, 3000L)));
    }

    /** Real planning-domain objects so mapping logic runs for real. */
    private VehicleRoutePlan solvedPlan() {
        RouteVehicle vehicle = new RouteVehicle(10L, 10L, 19.10, 72.90, 10000L);
        vehicle.getStops().add(new DeliveryStop(500L, 500L, 18.52, 73.85, 2000L));
        vehicle.getStops().add(new DeliveryStop(501L, 501L, 18.60, 73.90, 3000L));

        VehicleRoutePlan plan = new VehicleRoutePlan(
                UUID.randomUUID(),
                List.of(new DeliveryStop(500L, 500L, 18.52, 73.85, 2000L),
                        new DeliveryStop(501L, 501L, 18.60, 73.90, 3000L)),
                List.of(vehicle));
        return plan;
    }

    private void givenSolverReturns(VehicleRoutePlan plan) throws ExecutionException, InterruptedException {
        when(solverManager.solve(any(UUID.class), any(VehicleRoutePlan.class))).thenReturn(solverJob);
        when(solverJob.getFinalBestSolution()).thenReturn(plan);
    }

    // ── 1. Creation guards ───────────────────────────────────────────────────

    @Test
    @DisplayName("Empty vehicles -> 400 before solve or persistence")
    void rejectsEmptyVehicles() {
        CreateOptimizationJobRequest req = new CreateOptimizationJobRequest(Collections.emptyList(), List.of(1L));

        var ex = catchThrowableOfType(() -> service.solveSync(req, 7L), BusinessException.class);

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(solverManager);
        verify(jobRepository, never()).save(any());
    }

    @Test
    @DisplayName("Empty shipments -> 400 before solve or persistence")
    void rejectsEmptyShipments() {
        CreateOptimizationJobRequest req = new CreateOptimizationJobRequest(List.of(1L), Collections.emptyList());

        var ex = catchThrowableOfType(() -> service.solveSync(req, 7L), BusinessException.class);

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(solverManager);
        verify(jobRepository, never()).save(any());
    }

    // ── 2. Size guardrail (thread-bound sync contract) ──────────────────────

    @Test
    @DisplayName("Problem above synchronous size limit -> 400, solver NEVER invoked")
    void rejectsOversizedProblemBeforeTouchingSolver() {
        List<Long> manyVehicles = new ArrayList<>();
        for (long i = 1; i <= 51; i++) manyVehicles.add(i);
        List<Long> manyShipments = new ArrayList<>();
        for (long i = 1; i <= 201; i++) manyShipments.add(i);
        CreateOptimizationJobRequest oversized =
                new CreateOptimizationJobRequest(manyVehicles, manyShipments);

        var ex = catchThrowableOfType(() -> service.solveSync(oversized, 7L), BusinessException.class);

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(ex.getMessage()).contains("synchronous");
        verifyNoInteractions(solverManager);
        verifyNoInteractions(fleetQueryPort);
        verifyNoInteractions(shipmentQueryPort);
        verify(jobRepository, never()).save(any());
    }

    // ── 3. SOLVING -> SOLVED lifecycle ───────────────────────────────────────

    @Test
    @DisplayName("Happy path: persists SOLVING then SOLVED, maps coordinates into response")
    void solvesPersistsAndMapsCoordinates() throws Exception {
        givenPortData();
        givenSolverReturns(solvedPlan());

        RouteSolutionResponse response = service.solveSync(validRequest, 42L);

        // Lifecycle: exactly two persists — initial SOLVING, terminal SOLVED
        ArgumentCaptor<OptimizationJob> captor = ArgumentCaptor.forClass(OptimizationJob.class);
        verify(jobRepository, times(2)).save(captor.capture());
        assertThat(statusTimeline).containsExactly("SOLVING", "SOLVED");

        OptimizationJob finalJob = persistedJobs.get(1);
        assertThat(finalJob.getRequestedBy()).isEqualTo(42L);
        assertThat(finalJob.getCompletedAt()).isNotNull();
        assertThat(finalJob.getResultJson()).contains("\"vehicleId\":10").contains("500").contains("501");

        // Response contract: same job identity + REAL coordinates from port data
        assertThat(response.jobId()).isEqualTo(finalJob.getId());
        assertThat(response.status()).isEqualTo("SOLVED");
        assertThat(response.routes()).hasSize(1);

        var route = response.routes().get(0);
        assertThat(route.vehicleId()).isEqualTo(10L);
        assertThat(route.startLat()).isEqualTo(19.10);
        assertThat(route.startLng()).isEqualTo(72.90);
        assertThat(route.stops()).hasSize(2);
        assertThat(route.stops().get(0).shipmentId()).isEqualTo(500L);
        assertThat(route.stops().get(0).lat()).isEqualTo(18.52);
        assertThat(route.stops().get(0).lng()).isEqualTo(73.85);
        assertThat(route.stops().get(1).lat()).isEqualTo(18.60);

        // Solver received the SAME problem id as the persisted job
        verify(solverManager).solve(eq(finalJob.getId()), any(VehicleRoutePlan.class));
    }

    // ── 4. Solver failure -> FAILED ─────────────────────────────────────────

    @Test
    @DisplayName("Solver crash: job persisted as FAILED with error message, 500 raised")
    void marksFailedWhenSolverThrows() throws Exception {
        givenPortData();
        when(solverManager.solve(any(UUID.class), any(VehicleRoutePlan.class)))
                .thenThrow(new IllegalStateException("engine exploded"));

        var ex = catchThrowableOfType(() -> service.solveSync(validRequest, 42L), BusinessException.class);

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(ex.getMessage()).contains("Route solving failed");

        ArgumentCaptor<OptimizationJob> captor = ArgumentCaptor.forClass(OptimizationJob.class);
        verify(jobRepository, times(2)).save(captor.capture());
        assertThat(statusTimeline).containsExactly("SOLVING", "FAILED");
        OptimizationJob failedJob = captor.getAllValues().get(1);
        assertThat(failedJob.getStatus()).isEqualTo("FAILED");
        assertThat(failedJob.getErrorMessage()).contains("engine exploded");
        assertThat(failedJob.getCompletedAt()).isNotNull();
    }

    // ── 5. Status read for audit/history ─────────────────────────────────────

    @Test
    @DisplayName("getJobStatus returns mapped DTO for existing job")
    void exposesJobStatus() {
        OptimizationJob job = new OptimizationJob();
        job.setId(UUID.randomUUID());
        job.setStatus("FAILED");
        job.setErrorMessage("boom");
        job.setRequestedBy(9L);
        job.setCreatedAt(java.time.Instant.now());
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));

        var dto = service.getJobStatus(job.getId());

        assertThat(dto.status()).isEqualTo("FAILED");
        assertThat(dto.errorMessage()).isEqualTo("boom");
        assertThat(dto.requestedBy()).isEqualTo(9L);
    }

    @Test
    @DisplayName("getJobStatus unknown id -> 404")
    void jobStatusUnknownId() {
        when(jobRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        var ex = catchThrowableOfType(
                () -> service.getJobStatus(UUID.randomUUID()),
                ResourceNotFoundException.class);

        assertThat(ex).isNotNull();
    }
}
