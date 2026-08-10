package com.fleetvane.service;

import com.fleetvane.model.Incident;
import com.fleetvane.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;

    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    @Transactional
    public Incident reportIncident(Incident incident) {
        if (incident.getStatus() == null) {
            incident.setStatus("OPEN");
        }
        return incidentRepository.save(incident);
    }
}
