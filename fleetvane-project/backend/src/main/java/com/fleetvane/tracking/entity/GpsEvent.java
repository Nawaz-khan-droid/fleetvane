package com.fleetvane.tracking.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "gps_events")
public class GpsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    @Column(nullable = false)
    private Double heading;

    private Double speed;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt = Instant.now();

    public GpsEvent() {}

    public GpsEvent(Long vehicleId, Double lat, Double lng, Double heading, Double speed) {
        this.vehicleId = vehicleId;
        this.lat = lat;
        this.lng = lng;
        this.heading = heading;
        this.speed = speed;
        this.recordedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Double getHeading() { return heading; }
    public void setHeading(Double heading) { this.heading = heading; }

    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
