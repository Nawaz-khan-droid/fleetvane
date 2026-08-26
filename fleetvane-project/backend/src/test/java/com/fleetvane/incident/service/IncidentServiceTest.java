package com.fleetvane.incident.service;

import com.fleetvane.incident.dto.CreateIncidentRequest;
import com.fleetvane.incident.dto.IncidentReportDto;
import com.fleetvane.incident.entity.IncidentReport;
import com.fleetvane.incident.repository.IncidentReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentReportRepository incidentRepository;

    private IncidentService incidentService;

    private IncidentReport incidentReport;

    @BeforeEach
    void setUp() {
        incidentService = new IncidentService(incidentRepository);
        incidentReport = new IncidentReport();
        incidentReport.setId(1L);
        incidentReport.setType("DELAY");
        incidentReport.setDescription("Traffic delay at intersection");
        incidentReport.setLat(19.076);
        incidentReport.setLng(72.8777);
        incidentReport.setDriverId(100L);
        incidentReport.setShipmentId(200L);
        incidentReport.setCreatedAt(Instant.now());
    }

    @Test
    void getAllIncidents_AsDriver_ShouldReturnOnlyDriverIncidents() {
        Pageable pageable = PageRequest.of(0, 10);
        when(incidentRepository.findByDriverId(100L, pageable))
                .thenReturn(new PageImpl<>(List.of(incidentReport)));

        Page<IncidentReportDto> result = incidentService.getAllIncidents(pageable, "DRIVER", 100L);

        assertEquals(1, result.getTotalElements());
        assertEquals(100L, result.getContent().get(0).driverId());
    }

    @Test
    void getAllIncidents_AsManager_ShouldReturnAllIncidents() {
        Pageable pageable = PageRequest.of(0, 10);
        when(incidentRepository.findAll(pageable))
                .thenReturn(new PageImpl<>(List.of(incidentReport)));

        Page<IncidentReportDto> result = incidentService.getAllIncidents(pageable, "MANAGER", 100L);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void reportIncident_ShouldPersistIncident() {
        CreateIncidentRequest request = new CreateIncidentRequest(
                "BREAKDOWN",
                "Engine failure on highway",
                19.08,
                72.88,
                200L
        );

        when(incidentRepository.save(any(IncidentReport.class))).thenAnswer(i -> {
            IncidentReport ir = i.getArgument(0);
            ir.setId(2L);
            ir.setCreatedAt(Instant.now());
            return ir;
        });

        IncidentReportDto result = incidentService.reportIncident(request, 100L);

        assertNotNull(result);
        assertEquals("BREAKDOWN", result.type());
        assertEquals("Engine failure on highway", result.description());
        assertEquals(19.08, result.lat());
        assertEquals(72.88, result.lng());
        assertEquals(100L, result.driverId());
        assertEquals(200L, result.shipmentId());
    }
}
