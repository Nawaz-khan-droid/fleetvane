package com.fleetvane.fleet.entity;

import com.fleetvane.shared.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "vehicles")
public class Vehicle extends BaseEntity {
    private String plateNumber;
    private String type;
    private String model;
    private Double capacity;
    private String fuelType;
    private String status;
    private Double lat;
    private Double lng;
    private Double heading;

    public Vehicle() {}

    public Vehicle(String plateNumber, String type, String model, Double capacity, String fuelType, String status, Double lat, Double lng, Double heading) {
        this.plateNumber = plateNumber;
        this.type = type;
        this.model = model;
        this.capacity = capacity;
        this.fuelType = fuelType;
        this.status = status;
        this.lat = lat;
        this.lng = lng;
        this.heading = heading;
    }

    public String getPlateNumber() { return plateNumber; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Double getCapacity() { return capacity; }
    public void setCapacity(Double capacity) { this.capacity = capacity; }

    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public Double getHeading() { return heading; }
    public void setHeading(Double heading) { this.heading = heading; }
}
