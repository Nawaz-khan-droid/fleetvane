package com.fleetvane.driver.entity;

import com.fleetvane.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "driver_profiles")
public class DriverProfile extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "license_number", nullable = false, unique = true)
    private String licenseNumber;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    public DriverProfile() {}

    public DriverProfile(Long userId, String licenseNumber, Long vehicleId, Boolean isAvailable) {
        this.userId = userId;
        this.licenseNumber = licenseNumber;
        this.vehicleId = vehicleId;
        this.isAvailable = isAvailable;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
}
