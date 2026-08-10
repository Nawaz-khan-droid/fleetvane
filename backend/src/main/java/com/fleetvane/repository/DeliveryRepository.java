package com.fleetvane.repository;

import com.fleetvane.model.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    List<Delivery> findByTruckId(Long truckId);
    List<Delivery> findByStatus(String status);
}
