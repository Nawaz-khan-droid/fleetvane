package com.fleetvane.driver.shift;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_shifts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DriverShift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_id", nullable = false)
    private Long driverId;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "shift_started_at", nullable = false)
    private LocalDateTime shiftStartedAt;

    @Column(name = "shift_ended_at")
    private LocalDateTime shiftEndedAt;

    @Column(name = "last_break_at")
    private LocalDateTime lastBreakAt;

    @Column(name = "is_on_break")
    @Builder.Default
    private Boolean isOnBreak = false;

    @Column(name = "total_driving_seconds")
    @Builder.Default
    private Integer totalDrivingSeconds = 0;

    @Column(name = "compliance_breached")
    @Builder.Default
    private Boolean complianceBreached = false;

    @Column(name = "breach_reason")
    private String breachReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isOnBreak == null) this.isOnBreak = false;
        if (this.totalDrivingSeconds == null) this.totalDrivingSeconds = 0;
        if (this.complianceBreached == null) this.complianceBreached = false;
    }
}
