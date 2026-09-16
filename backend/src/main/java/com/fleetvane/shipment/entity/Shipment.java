package com.fleetvane.shipment.entity;

import com.fleetvane.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "shipments")
public class Shipment extends BaseEntity {
    private Long clientId;
    private String status;
    private String originAddress;
    private Double pickupLatitude;
    private Double pickupLongitude;
    private String destinationAddress;
    private Double deliveryLatitude;
    private Double deliveryLongitude;
    private Double weight;
    @Column(name = "length_cm")
    private Double lengthCm;
    @Column(name = "width_cm")
    private Double widthCm;
    @Column(name = "height_cm")
    private Double heightCm;
    @Column(name = "volume_m3")
    private Double volumeM3;
    private Instant eta;
    private Instant assignedAt;
    private Instant pickedUpAt;
    private Instant deliveredAt;
    private Instant cancelledAt;

    @jakarta.persistence.Column(columnDefinition="TEXT")
    private String podPhotoBase64;

    @jakarta.persistence.Column(columnDefinition="TEXT")
    private String podSignatureBase64;
    private Long vehicleId;
    private Long driverId;

    public Shipment() {}

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOriginAddress() { return originAddress; }
    public void setOriginAddress(String originAddress) { this.originAddress = originAddress; }

    public Double getPickupLatitude() { return pickupLatitude; }
    public void setPickupLatitude(Double pickupLatitude) { this.pickupLatitude = pickupLatitude; }

    public Double getPickupLongitude() { return pickupLongitude; }
    public void setPickupLongitude(Double pickupLongitude) { this.pickupLongitude = pickupLongitude; }

    public String getDestinationAddress() { return destinationAddress; }
    public void setDestinationAddress(String destinationAddress) { this.destinationAddress = destinationAddress; }

    public Double getDeliveryLatitude() { return deliveryLatitude; }
    public void setDeliveryLatitude(Double deliveryLatitude) { this.deliveryLatitude = deliveryLatitude; }

    public Double getDeliveryLongitude() { return deliveryLongitude; }
    public void setDeliveryLongitude(Double deliveryLongitude) { this.deliveryLongitude = deliveryLongitude; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getLengthCm() { return lengthCm; }
    public void setLengthCm(Double lengthCm) { this.lengthCm = lengthCm; }

    public Double getWidthCm() { return widthCm; }
    public void setWidthCm(Double widthCm) { this.widthCm = widthCm; }

    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }

    public Double getVolumeM3() { return volumeM3; }
    public void setVolumeM3(Double volumeM3) { this.volumeM3 = volumeM3; }

    public Instant getEta() { return eta; }
    public void setEta(Instant eta) { this.eta = eta; }

    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }

    public Instant getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(Instant pickedUpAt) { this.pickedUpAt = pickedUpAt; }

    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }

    public Instant getCancelledAt() { return cancelledAt; }

    public String getPodPhotoBase64() { return podPhotoBase64; }
    public void setPodPhotoBase64(String podPhotoBase64) { this.podPhotoBase64 = podPhotoBase64; }

    public String getPodSignatureBase64() { return podSignatureBase64; }
    public void setPodSignatureBase64(String podSignatureBase64) { this.podSignatureBase64 = podSignatureBase64; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }
}


