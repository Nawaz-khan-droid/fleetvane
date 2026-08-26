package com.fleetvane.fleet.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "depots")
public class Depot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String city;
    private String address;
    private Double lat;
    private Double lng;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    public Depot() {}

    public Depot(String name, String city, String address, Double lat, Double lng) {
        this.name = name;
        this.city = city;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
        this.isActive = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (isActive == null) isActive = true;
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCity() { return city; }
    public String getAddress() { return address; }
    public Double getLat() { return lat; }
    public Double getLng() { return lng; }
    public Boolean getIsActive() { return isActive; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
