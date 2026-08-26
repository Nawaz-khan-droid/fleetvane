package com.fleetvane.tracking.service;

import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import com.fleetvane.tracking.application.VehiclePersistencePort;
import com.fleetvane.tracking.dto.LocationUpdateRequest;
import com.fleetvane.tracking.entity.GpsEvent;
import com.fleetvane.tracking.repository.GpsEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Tracking lifecycle against its OWN abstraction ({@link VehiclePersistencePort}).
 * The fleet-side adapter behaviour (NOT NULL normalisation etc.) is covered by
 * integration tests; here we verify orchestration, authorisation, and telemetry.
 */
@ExtendWith(MockitoExtension.class)
class TrackingServiceTest {

    @Mock
    private VehiclePersistencePort vehiclePersistencePort;

    @Mock
    private GpsEventRepository gpsEventRepository;

    @Mock
    private DriverProfileRepository driverProfileRepository;

    private TrackingService trackingService;

    @BeforeEach
    void setUp() {
        trackingService = new TrackingService(vehiclePersistencePort, gpsEventRepository, driverProfileRepository);
    }

    private DriverProfile profileFor(long userId, long vehicleId) {
        DriverProfile profile = new DriverProfile();
        profile.setUserId(userId);
        profile.setVehicleId(vehicleId);
        return profile;
    }

    @Test
    @DisplayName("MANAGER update delegates to port with normalised heading and persists GPS event")
    void managerUpdateDelegatesAndPersists() {
        trackingService.updateVehicleLocation(1L, new LocationUpdateRequest(19.08, 72.88, 45.0, 12.5), "MANAGER", 1L);

        verify(vehiclePersistencePort).applyGpsLocation(1L, 19.08, 72.88, 45.0);

        ArgumentCaptor<GpsEvent> captor = ArgumentCaptor.forClass(GpsEvent.class);
        verify(gpsEventRepository).save(captor.capture());
        GpsEvent saved = captor.getValue();
        assertEquals(1L, saved.getVehicleId());
        assertEquals(19.08, saved.getLat());
        assertEquals(72.88, saved.getLng());
        assertEquals(45.0, saved.getHeading());
        assertEquals(12.5, saved.getSpeed());
    }

    @Test
    @DisplayName("Null heading is normalised to 0.0 before delegation")
    void nullHeadingNormalised() {
        trackingService.updateVehicleLocation(1L, new LocationUpdateRequest(19.08, 72.88, null, null), "MANAGER", 1L);

        verify(vehiclePersistencePort).applyGpsLocation(1L, 19.08, 72.88, 0.0);
        ArgumentCaptor<GpsEvent> captor = ArgumentCaptor.forClass(GpsEvent.class);
        verify(gpsEventRepository).save(captor.capture());
        assertEquals(0.0, captor.getValue().getHeading());
    }

    @Test
    @DisplayName("DRIVER assigned to vehicle -> allowed")
    void driverAssignedAllowed() {
        when(driverProfileRepository.findByUserId(5L)).thenReturn(Optional.of(profileFor(5L, 1L)));

        trackingService.updateVehicleLocation(1L, new LocationUpdateRequest(19.08, 72.88, 45.0, null), "DRIVER", 5L);

        verify(vehiclePersistencePort).applyGpsLocation(eq(1L), anyDouble(), anyDouble(), any());
        verify(gpsEventRepository).save(any(GpsEvent.class));
    }

    @Test
    @DisplayName("DRIVER assigned elsewhere -> 403 and NO writes at all")
    void driverNotAssignedRejected() {
        when(driverProfileRepository.findByUserId(5L)).thenReturn(Optional.of(profileFor(5L, 999L)));

        assertThrows(BusinessException.class, () ->
                trackingService.updateVehicleLocation(1L, new LocationUpdateRequest(19.08, 72.88, 45.0, null), "DRIVER", 5L));

        verifyNoInteractions(vehiclePersistencePort);
        verify(gpsEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Unknown vehicle during update -> 404 from adapter, no GPS event")
    void unknownVehicleOnUpdate() {
        doThrow(new ResourceNotFoundException("Vehicle", "id", 999L))
                .when(vehiclePersistencePort).applyGpsLocation(eq(999L), anyDouble(), anyDouble(), any());

        assertThrows(ResourceNotFoundException.class, () ->
                trackingService.updateVehicleLocation(999L, new LocationUpdateRequest(19.08, 72.88, 45.0, 12.5), "MANAGER", 1L));

        verify(gpsEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("History read validates existence via port")
    void historyValidatesExistenceThroughPort() {
        when(vehiclePersistencePort.vehicleExists(7L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () ->
                trackingService.getVehicleHistory(7L, PageRequest.of(0, 10), "MANAGER", 1L));

        verify(gpsEventRepository, never()).findByVehicleIdOrderByRecordedAtDesc(anyLong(), any());
    }
}
