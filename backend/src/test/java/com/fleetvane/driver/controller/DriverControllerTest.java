package com.fleetvane.driver.controller;

import com.fleetvane.driver.service.DriverService;
import com.fleetvane.driver.shift.DriverShift;
import com.fleetvane.driver.shift.DriverShiftService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriverControllerTest {

    @Mock private DriverService driverService;
    @Mock private DriverShiftService shiftService;

    private Authentication driverAuthentication() {
        return new UsernamePasswordAuthenticationToken("42", null);
    }

    @Test
    void availabilityUsesAuthenticatedDriversIdentity() {
        DriverController controller = new DriverController(driverService, shiftService);

        controller.toggleAvailability(driverAuthentication());

        verify(driverService).toggleAvailability(42L);
    }

    @Test
    void shiftActionsUseAuthenticatedDriversIdentity() {
        DriverController controller = new DriverController(driverService, shiftService);
        when(shiftService.startShift(42L, 9L)).thenReturn(new DriverShift());
        when(shiftService.endShift(42L)).thenReturn(new DriverShift());

        controller.startShift(driverAuthentication(), 9L);
        controller.endShift(driverAuthentication());

        verify(shiftService).startShift(42L, 9L);
        verify(shiftService).endShift(42L);
    }
}
