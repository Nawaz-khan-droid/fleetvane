package com.fleetvane.driver.service;

import com.fleetvane.auth.entity.User;
import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.driver.dto.CreateDriverProfileRequest;
import com.fleetvane.driver.dto.DriverProfileDto;
import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import com.fleetvane.shared.exception.BusinessException;
import com.fleetvane.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DriverService {

    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;

    public DriverService(DriverProfileRepository driverProfileRepository, UserRepository userRepository) {
        this.driverProfileRepository = driverProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DriverProfileDto getProfileByUserId(Long userId) {
        return driverProfileRepository.findByUserId(userId)
            .map(profile -> mapToDto(profile, null))
            .orElseThrow(() -> new ResourceNotFoundException("DriverProfile", "userId", userId));
    }

    @Transactional(readOnly = true)
    public Page<DriverProfileDto> getAllDrivers(Pageable pageable) {
        Page<DriverProfile> profiles = driverProfileRepository.findAll(pageable);
        
        // Batch-fetch all users in ONE query instead of N+1
        List<Long> userIds = profiles.getContent().stream()
                .map(DriverProfile::getUserId)
                .collect(Collectors.toList());
        Map<Long, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        
        return profiles.map(profile -> mapToDto(profile, usersById));
    }

    @Transactional
    public DriverProfileDto createProfile(Long userId, CreateDriverProfileRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        if (driverProfileRepository.findByUserId(userId).isPresent()) {
            throw new BusinessException("Driver profile already exists for this user", HttpStatus.CONFLICT);
        }

        DriverProfile profile = new DriverProfile(
            userId,
            request.licenseNumber(),
            request.vehicleId(),
            false
        );
            
        return mapToDto(driverProfileRepository.save(profile), null);
    }

    @Transactional
    public DriverProfileDto toggleAvailability(Long userId) {
        DriverProfile profile = driverProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("DriverProfile", "userId", userId));
            
        profile.setIsAvailable(!Boolean.TRUE.equals(profile.getIsAvailable()));
        return mapToDto(driverProfileRepository.save(profile), null);
    }

    @Transactional
    public void deleteDriver(Long userId) {
        DriverProfile profile = driverProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("DriverProfile", "userId", userId));
        try {
            driverProfileRepository.delete(profile);
            userRepository.deleteById(userId);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new BusinessException("Cannot delete driver because they are still referenced by other records (e.g. shipments or shifts).", HttpStatus.CONFLICT);
        }
    }

    /**
     * Maps a DriverProfile to DTO. If usersById is provided, uses the batch-loaded map
     * to avoid individual DB lookups. Falls back to a single query when the map is null.
     */
    private DriverProfileDto mapToDto(DriverProfile profile, Map<Long, User> usersById) {
        String userName;
        if (usersById != null) {
            User user = usersById.get(profile.getUserId());
            userName = user != null ? user.getName() : null;
        } else {
            userName = userRepository.findById(profile.getUserId())
                    .map(User::getName)
                    .orElse(null);
        }
        return new DriverProfileDto(
            profile.getId(),
            profile.getUserId(),
            userName,
            profile.getLicenseNumber(),
            profile.getVehicleId(),
            profile.getIsAvailable(),
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }
}
