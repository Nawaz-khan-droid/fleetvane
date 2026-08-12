package com.fleetvane.incident.service;

import com.fleetvane.incident.dto.CreateIncidentRequest;
import com.fleetvane.incident.dto.IncidentReportDto;
import com.fleetvane.incident.entity.IncidentReport;
import com.fleetvane.incident.repository.IncidentReportRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class IncidentService {

    private final IncidentReportRepository incidentRepository;

    public IncidentService(IncidentReportRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    @Transactional(readOnly = true)
    public Page<IncidentReportDto> getAllIncidents(Pageable pageable, String role, Long userId) {
        Page<IncidentReport> incidents;
        
        if ("DRIVER".equals(role)) {
            incidents = incidentRepository.findByDriverId(userId, pageable);
        } else {
            incidents = incidentRepository.findAll(pageable);
        }
        
        return incidents.map(this::mapToDto);
    }

    @Transactional
    public IncidentReportDto reportIncident(CreateIncidentRequest request, Long driverId) {
        IncidentReport incident = new IncidentReport();
        incident.setType(request.type());
        incident.setDescription(request.description());
        incident.setLat(request.lat());
        incident.setLng(request.lng());
        incident.setShipmentId(request.shipmentId());
        incident.setDriverId(driverId);
        incident.setCreatedAt(Instant.now());
        
        return mapToDto(incidentRepository.save(incident));
    }

    private IncidentReportDto mapToDto(IncidentReport incident) {
        return new IncidentReportDto(
                incident.getId(),
                incident.getType(),
                incident.getDescription(),
                incident.getLat(),
                incident.getLng(),
                incident.getDriverId(),
                incident.getShipmentId(),
                incident.getCreatedAt()
        );
    }
}
