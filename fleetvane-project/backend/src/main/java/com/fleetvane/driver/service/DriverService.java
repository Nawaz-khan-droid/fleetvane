package com.fleetvane.driver.service;

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
            .map(this::mapToDto)
            .orElseThrow(() -> new ResourceNotFoundException("DriverProfile", "userId", userId));
    }

    @Transactional(readOnly = true)
    public Page<DriverProfileDto> getAllDrivers(Pageable pageable) {
        return driverProfileRepository.findAll(pageable).map(this::mapToDto);
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
            
        return mapToDto(driverProfileRepository.save(profile));
    }

    @Transactional
    public DriverProfileDto toggleAvailability(Long userId) {
        DriverProfile profile = driverProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("DriverProfile", "userId", userId));
            
        profile.setIsAvailable(!Boolean.TRUE.equals(profile.getIsAvailable()));
        return mapToDto(driverProfileRepository.save(profile));
    }

    private DriverProfileDto mapToDto(DriverProfile profile) {
        String userName = userRepository.findById(profile.getUserId())
                .map(u -> u.getName())
                .orElse(null);
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
