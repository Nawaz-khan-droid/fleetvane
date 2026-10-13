package com.fleetvane.routing.service;

import com.fleetvane.routing.application.FleetQueryPort;
import com.fleetvane.routing.application.ShipmentQueryPort;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Lifecycle tests for the SYNCHRONOUS routing job:
 *
 *   creation guards ──> SOLVING (persisted) ──> SOLVED (persisted w/ road geometry)
 *                                        └───> FAILED (persisted w/ error)
 */
@ExtendWith(MockitoExtension.class)
class RouteSolverServiceTest {

    @Mock private OsrmRoutingService osrmRoutingService;
    @Mock private OptimizationJobRepository jobRepository;
    @Mock private FleetQueryPort fleetQueryPort;
    @Mock private ShipmentQueryPort shipmentQueryPort;

    @InjectMocks
    private RouteSolverService service;

    private CreateOptimizationJobRequest validRequest;
    private List<OptimizationJob> persistedJobs;
    private List<String> statusTimeline;

    @BeforeEach
    void setUp() {
        validRequest = new CreateOptimizationJobRequest(List.of(10L), List.of(500L, 501L));
        persistedJobs = new ArrayList<>();
        statusTimeline = new ArrayList<>();
        lenient().when(jobRepository.save(any(OptimizationJob.class))).thenAnswer(inv -> {
            OptimizationJob job = inv.getArgument(0);
            statusTimeline.add(job.getStatus());
            persistedJobs.add(job);
            return job;
        });
    }

    private void givenPortData() {
        when(fleetQueryPort.findAllById(validRequest.vehicleIds())).thenReturn(List.of(
                new FleetQueryPort.VehicleData(10L, 10L, 19.10, 72.90, 10000L, 30.0)));
        when(shipmentQueryPort.findAllById(validRequest.shipmentIds())).thenReturn(List.of(
                new ShipmentQueryPort.ShipmentData(500L, 18.52, 73.85, 2000L, 1.5),
                new ShipmentQueryPort.ShipmentData(501L, 18.60, 73.90, 3000L, 2.0)));
    }

    private void givenOsrmReturnsRoute() {
        when(osrmRoutingService.getRoute(any())).thenReturn(new OsrmRoutingService.RouteResult(
                List.of(new double[]{19.10, 72.90}, new double[]{18.52, 73.85}, new double[]{18.60, 73.90}),
                150000.0,
                7200.0
        ));
    }

    // ── 1. Creation guards ───────────────────────────────────────────────────

    @Test
    @DisplayName("Empty vehicles -> 400 before solve or persistence")
    void rejectsEmptyVehicles() {
        CreateOptimizationJobRequest req = new CreateOptimizationJobRequest(Collections.emptyList(), List.of(1L));

        var ex = catchThrowableOfType(() -> service.solveSync(req, 7L), BusinessException.class);

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(osrmRoutingService);
        verify(jobRepository, never()).save(any());
    }

    @Test
    @DisplayName("Empty shipments -> 400 before solve or persistence")
    void rejectsEmptyShipments() {
        CreateOptimizationJobRequest req = new CreateOptimizationJobRequest(List.of(1L), Collections.emptyList());

        var ex = catchThrowableOfType(() -> service.solveSync(req, 7L), BusinessException.class);

        assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(osrmRoutingService);
        verify(jobRepository, never()).save(any());
    }

    // ── 2. Size guardrail ────────────────────────────────────────────────────

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
        verifyNoInteractions(osrmRoutingService);
        verifyNoInteractions(fleetQueryPort);
        verifyNoInteractions(shipmentQueryPort);
        verify(jobRepository, never()).save(any());
    }

    // ── 3. SOLVING -> SOLVED lifecycle ───────────────────────────────────────

    @Test
    @DisplayName("Happy path: persists SOLVING then SOLVED, maps coordinates and road geometry into response")
    void solvesPersistsAndMapsCoordinates() {
        givenPortData();
        givenOsrmReturnsRoute();

        RouteSolutionResponse response = service.solveSync(validRequest, 42L);

        ArgumentCaptor<OptimizationJob> captor = ArgumentCaptor.forClass(OptimizationJob.class);
        verify(jobRepository, times(2)).save(captor.capture());
        assertThat(statusTimeline).containsExactly("SOLVING", "SOLVED");

        OptimizationJob finalJob = persistedJobs.get(1);
        assertThat(finalJob.getRequestedBy()).isEqualTo(42L);
        assertThat(finalJob.getCompletedAt()).isNotNull();
        assertThat(finalJob.getResultJson()).contains("\"vehicleId\":10").contains("500").contains("501");

        // Response contract: same job identity + REAL coordinates + OSRM road geometry
        assertThat(response.jobId()).isEqualTo(finalJob.getId());
        assertThat(response.status()).isEqualTo("SOLVED");
        assertThat(response.routes()).hasSize(1);

        var route = response.routes().get(0);
        assertThat(route.vehicleId()).isEqualTo(10L);
        assertThat(route.startLat()).isEqualTo(19.10);
        assertThat(route.startLng()).isEqualTo(72.90);
        assertThat(route.stops()).hasSize(2);
        assertThat(route.geometry()).hasSize(3);
        assertThat(route.distanceMeters()).isEqualTo(150000.0);
        assertThat(route.durationSeconds()).isEqualTo(7200.0);

        verify(osrmRoutingService).getRoute(any());
    }

    // ── 4. Routing failure -> FAILED ─────────────────────────────────────────

    @Test
    @DisplayName("Routing exception: job persisted as FAILED with error message, 500 raised")
    void marksFailedWhenSolverThrows() {
        givenPortData();
        when(osrmRoutingService.getRoute(any())).thenThrow(new IllegalStateException("engine exploded"));

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
