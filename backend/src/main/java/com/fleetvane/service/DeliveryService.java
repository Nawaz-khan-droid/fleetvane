package com.fleetvane.service;

import com.fleetvane.model.Delivery;
import com.fleetvane.repository.DeliveryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    public List<Delivery> getDeliveriesByTruck(Long truckId) {
        return deliveryRepository.findByTruckId(truckId);
    }

    public Delivery getDeliveryById(Long id) {
        return deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + id));
    }

    @Transactional
    public Delivery createDelivery(Delivery delivery) {
        return deliveryRepository.save(delivery);
    }

    @Transactional
    public Delivery updateDeliveryStatus(Long id, String status) {
        Delivery delivery = getDeliveryById(id);
        delivery.setStatus(status);
        if ("DELIVERED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
            delivery.setCompletedAt(LocalDateTime.now());
        }
        return deliveryRepository.save(delivery);
    }
}
