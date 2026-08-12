package com.fleetvane.driver.service;

import com.fleetvane.auth.repository.UserRepository;
import com.fleetvane.driver.dto.CreateDriverProfileRequest;
import com.fleetvane.driver.dto.DriverProfileDto;
import com.fleetvane.driver.entity.DriverProfile;
import com.fleetvane.driver.repository.DriverProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
            .orElseThrow(() -> new RuntimeException("Driver profile not found"));
    }

    @Transactional(readOnly = true)
    public Page<DriverProfileDto> getAllDrivers(Pageable pageable) {
        return driverProfileRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional
    public DriverProfileDto createProfile(Long userId, CreateDriverProfileRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
        
        if (driverProfileRepository.findByUserId(userId).isPresent()) {
            throw new RuntimeException("Profile already exists");
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
            .orElseThrow(() -> new RuntimeException("Driver profile not found"));
            
        profile.setIsAvailable(!Boolean.TRUE.equals(profile.getIsAvailable()));
        return mapToDto(driverProfileRepository.save(profile));
    }

    private DriverProfileDto mapToDto(DriverProfile profile) {
        return new DriverProfileDto(
            profile.getId(),
            profile.getUserId(),
            profile.getLicenseNumber(),
            profile.getVehicleId(),
            profile.getIsAvailable(),
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }
}
