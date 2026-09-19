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
    private final com.fleetvane.auth.repository.UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DepotDto> getAllActiveDepots() {
        Long companyId = getCurrentUserCompanyId();
        return depotRepository.findByCompanyIdAndIsActiveTrue(companyId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private Long getCurrentUserCompanyId() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new com.fleetvane.shared.exception.BusinessException("Authentication required", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        try {
            Long userId = Long.valueOf(authentication.getName());
            return userRepository.findById(userId)
                    .map(com.fleetvane.auth.entity.User::getCompanyId)
                    .orElseThrow(() -> new com.fleetvane.shared.exception.BusinessException("User not found", org.springframework.http.HttpStatus.UNAUTHORIZED));
        } catch (NumberFormatException e) {
            throw new com.fleetvane.shared.exception.BusinessException("Invalid authentication principal", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
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
        depot.setCompanyId(getCurrentUserCompanyId());
        return mapToDto(depotRepository.save(depot));
    }

    @Transactional
    public void deleteDepot(Long id) {
        Depot depot = depotRepository.findById(id)
            .orElseThrow(() -> new com.fleetvane.shared.exception.ResourceNotFoundException("Depot", "id", id));
        depot.setIsActive(false);
        depotRepository.save(depot);
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
