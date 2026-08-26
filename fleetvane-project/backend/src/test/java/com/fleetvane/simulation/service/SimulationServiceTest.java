package com.fleetvane.simulation.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import org.mockito.ArgumentCaptor;

/**
 * Lifecycle contract for the simulation engine: start (idempotent, seeds +
 * schedules ticks), stop (idempotent), and ticks that survive transient errors.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SimulationServiceTest {

    @Mock private com.fleetvane.fleet.repository.VehicleRepository vehicleRepository;
    @Mock private com.fleetvane.shipment.repository.ShipmentRepository shipmentRepository;
    @Mock private com.fleetvane.tracking.repository.GpsEventRepository gpsEventRepository;
    @Mock private ScheduledExecutorService executor;

    private SimulationService service;

    @BeforeEach
    void setUp() {
        service = new SimulationService(vehicleRepository, shipmentRepository, gpsEventRepository);
    }

    @Test
    @DisplayName("start: seeds once, schedules periodic ticks, becomes running")
    void startSeedsAndSchedules() {
        when(vehicleRepository.findAll()).thenReturn(List.of());

        service.start(executor);

        assertThat(service.isRunning()).isTrue();
        // Seed ran against empty fleet without error
        verify(vehicleRepository).findAll();
        // Tick scheduled: initial delay 2s, period 5s
        verify(executor).scheduleAtFixedRate(any(Runnable.class), eq(2L), eq(5L), eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("start while running is a no-op (no double scheduler)")
    void startIsIdempotent() {
        when(vehicleRepository.findAll()).thenReturn(List.of());
        service.start(executor);

        service.start(executor);

        verify(executor, times(1)).scheduleAtFixedRate(any(Runnable.class), anyLong(), anyLong(), any());
    }

    @Test
    @DisplayName("stop shuts the scheduler down and clears running state")
    void stopShutsDown() {
        when(vehicleRepository.findAll()).thenReturn(List.of());
        service.start(executor);

        service.stop();

        assertThat(service.isRunning()).isFalse();
        verify(executor).shutdownNow();

        service.stop(); // idempotent
        verify(executor, times(1)).shutdownNow();
    }

    @Test
    @DisplayName("Ticks survive repository failures (engine keeps ticking)")
    void ticksAreFailureTolerant() throws Exception {
        when(vehicleRepository.findAll()).thenReturn(List.of());
        service.start(executor);

        ArgumentCaptor<Runnable> tick = ArgumentCaptor.forClass(Runnable.class);
        verify(executor).scheduleAtFixedRate(tick.capture(), anyLong(), anyLong(), any());

        when(shipmentRepository.findByVehicleIdAndStatusIn(any(), any()))
                .thenThrow(new RuntimeException("transient db blip"));

        tick.getValue().run(); // must NOT throw

        assertThat(service.isRunning()).isTrue();
    }
}
