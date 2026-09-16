package com.fleetvane.driver.shift;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class DriverShiftService {

    private final DriverShiftRepository shiftRepository;

    @Transactional
    public DriverShift startShift(Long driverId, Long vehicleId) {
        DriverShift shift = DriverShift.builder()
                .driverId(driverId)
                .vehicleId(vehicleId)
                .shiftStartedAt(LocalDateTime.now())
                .isOnBreak(false)
                .build();
        return shiftRepository.save(shift);
    }

    @Transactional
    public DriverShift endShift(Long driverId) {
        DriverShift shift = shiftRepository.findActiveShift(driverId)
                .orElseThrow(() -> new IllegalArgumentException("No active shift found"));
        shift.setShiftEndedAt(LocalDateTime.now());
        return shiftRepository.save(shift);
    }
}
