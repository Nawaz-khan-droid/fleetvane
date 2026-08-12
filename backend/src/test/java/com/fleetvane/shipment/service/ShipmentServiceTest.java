package com.fleetvane.shipment.service;

import com.fleetvane.shipment.dto.CreateShipmentRequest;
import com.fleetvane.shipment.dto.ShipmentDto;
import com.fleetvane.shipment.entity.Shipment;
import com.fleetvane.shipment.repository.ShipmentRepository;
import com.fleetvane.shared.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipmentServiceTest {

    @Mock
    private ShipmentRepository shipmentRepository;

    @InjectMocks
    private ShipmentService shipmentService;

    private Shipment shipment;

    @BeforeEach
    void setUp() {
        shipment = new Shipment();
        shipment.setId(1L);
        shipment.setClientId(100L);
        shipment.setStatus("REQUESTED");
    }

    @Test
    void testCreateShipment() {
        CreateShipmentRequest request = new CreateShipmentRequest(
                "Origin", 10.0, 20.0, "Dest", 30.0, 40.0, 50.0
        );

        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(i -> {
            Shipment s = i.getArgument(0);
            s.setId(1L);
            return s;
        });

        ShipmentDto result = shipmentService.createShipment(request, 100L);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals("REQUESTED", result.status());
        assertEquals(100L, result.clientId());
        verify(shipmentRepository).save(any(Shipment.class));
    }

    @Test
    void testUpdateStatus_StateMachineLogic_Success() {
        // ASSIGNED -> IN_TRANSIT
        shipment.setStatus("ASSIGNED");
        shipment.setDriverId(200L);
        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(Shipment.class))).thenReturn(shipment);

        ShipmentDto result = shipmentService.updateStatus(1L, "IN_TRANSIT", "DRIVER", 200L);
        
        assertEquals("IN_TRANSIT", result.status());
        assertNotNull(shipment.getPickedUpAt());

        // IN_TRANSIT -> DELIVERED
        result = shipmentService.updateStatus(1L, "DELIVERED", "DRIVER", 200L);
        assertEquals("DELIVERED", result.status());
        assertNotNull(shipment.getDeliveredAt());
    }

    @Test
    void testUpdateStatus_DriverAuth_Failure() {
        shipment.setStatus("ASSIGNED");
        shipment.setDriverId(200L);
        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            shipmentService.updateStatus(1L, "IN_TRANSIT", "DRIVER", 999L);
        });

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertTrue(exception.getMessage().contains("Access Denied"));
        verify(shipmentRepository, never()).save(any(Shipment.class));
    }
}
