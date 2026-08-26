package com.fleetvane.fleet.service;

import com.fleetvane.fleet.dto.CreateVehicleRequest;
import com.fleetvane.fleet.dto.VehicleDto;
import com.fleetvane.fleet.entity.Vehicle;
import com.fleetvane.fleet.repository.DepotRepository;
import com.fleetvane.fleet.repository.VehicleRepository;
import com.fleetvane.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private DepotRepository depotRepository;

    @Mock

    private VehicleService vehicleService;

    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        vehicleService = new VehicleService(vehicleRepository, depotRepository);
        vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlateNumber("MH-01-AB-1234");
        vehicle.setType("TRUCK");
        vehicle.setModel("Tata Prima");
        vehicle.setCapacity(15000.0);
        vehicle.setFuelType("DIESEL");
        vehicle.setStatus("AVAILABLE");
        vehicle.setLat(19.076);
        vehicle.setLng(72.8777);
        vehicle.setHeading(0.0);
        vehicle.setCreatedAt(Instant.now());
        vehicle.setUpdatedAt(Instant.now());
    }

    @Test
    void getAllVehicles_WithoutStatusFilter_ShouldReturnAllVehicles() {
        Pageable pageable = PageRequest.of(0, 10);
        when(vehicleRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(vehicle)));

        Page<VehicleDto> result = vehicleService.getAllVehicles(pageable, null);

        assertEquals(1, result.getTotalElements());
        assertEquals("MH-01-AB-1234", result.getContent().get(0).plateNumber());
    }

    @Test
    void getAllVehicles_WithStatusFilter_ShouldReturnFilteredVehicles() {
        Pageable pageable = PageRequest.of(0, 10);
        when(vehicleRepository.findByStatus("IN_USE", pageable))
                .thenReturn(new PageImpl<>(List.of(vehicle)));

        Page<VehicleDto> result = vehicleService.getAllVehicles(pageable, "IN_USE");

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getVehicleById_Exists_ShouldReturnVehicleDto() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        VehicleDto result = vehicleService.getVehicleById(1L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("MH-01-AB-1234", result.plateNumber());
    }

    @Test
    void createVehicle_ShouldRejectWhenNoLocationSourceProvided() {
        CreateVehicleRequest request = new CreateVehicleRequest(
                "DL-04-XYZ-9999",
                "VAN",
                "Ford Transit",
                3000.0,
                "DIESEL",
                null,
                null,
                null
        );

        BusinessException exception = assertThrows(BusinessException.class,
                () -> vehicleService.createVehicle(request));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("hardcoded default location"));
        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    void createVehicle_ShouldUseExplicitCoordinates() {
        CreateVehicleRequest request = new CreateVehicleRequest(
                "DL-04-XYZ-9999",
                "VAN",
                "Ford Transit",
                3000.0,
                "DIESEL",
                null,
                48.8566,
                2.3522
        );

        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(i -> {
            Vehicle v = i.getArgument(0);
            v.setId(2L);
            return v;
        });

        VehicleDto result = vehicleService.createVehicle(request);

        assertNotNull(result);
        assertEquals("DL-04-XYZ-9999", result.plateNumber());
        assertEquals(48.8566, result.lat());
        assertEquals(2.3522, result.lng());
        assertEquals(0.0, result.heading());
    }
}
