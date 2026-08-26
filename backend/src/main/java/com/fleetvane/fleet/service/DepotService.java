package com.fleetvane.fleet.service;

import com.fleetvane.fleet.dto.CreateDepotRequest;
import com.fleetvane.fleet.dto.DepotDto;
import com.fleetvane.fleet.entity.Depot;
import com.fleetvane.fleet.repository.DepotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepotService {

    private final DepotRepository depotRepository;

    @Transactional(readOnly = true)
    public List<DepotDto> getAllActiveDepots() {
        return depotRepository.findByIsActiveTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepotDto createDepot(CreateDepotRequest request) {
        Depot depot = new Depot(
                request.name(),
                request.city(),
                request.address(),
                request.lat(),
                request.lng()
        );
        return mapToDto(depotRepository.save(depot));
    }

    private DepotDto mapToDto(Depot depot) {
        return new DepotDto(
                depot.getId(),
                depot.getName(),
                depot.getCity(),
                depot.getAddress(),
                depot.getLat(),
                depot.getLng()
        );
    }
}
