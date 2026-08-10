package com.fleetvane.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "trucks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Truck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String plateNumber;

    private String model;

    @Column(nullable = false)
    private String status;

    @Builder.Default
    @Column(columnDefinition = "double precision default 19.076")
    private Double lat = 19.076;

    @Builder.Default
    @Column(columnDefinition = "double precision default 72.8777")
    private Double lng = 72.8777;

    @Column(columnDefinition = "TIMESTAMP")
    private LocalDateTime lastHeartbeat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    @JsonBackReference
    private User manager;

    @Column(columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "truck", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Delivery> deliveries;

    @OneToMany(mappedBy = "truck", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Incident> incidents;

    @OneToMany(mappedBy = "truck", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<LocationHistory> locationHistory;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
