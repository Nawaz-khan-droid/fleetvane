package com.fleetvane.service;

import com.fleetvane.model.Truck;
import com.fleetvane.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TruckService {

    private final TruckRepository truckRepository;

    public List<Truck> getAllTrucks() {
        return truckRepository.findAll();
    }

    public Truck getTruckById(Long id) {
        return truckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Truck not found with id: " + id));
    }

    @Transactional
    public Truck createTruck(Truck truck) {
        return truckRepository.save(truck);
    }

    @Transactional
    public Truck updateTruckStatus(Long id, String status) {
        Truck truck = getTruckById(id);
        truck.setStatus(status);
        return truckRepository.save(truck);
    }

    @Transactional
    public Truck updateTruckLocation(Long id, Double lat, Double lng) {
        Truck truck = getTruckById(id);
        truck.setLat(lat);
        truck.setLng(lng);
        truck.setLastHeartbeat(LocalDateTime.now());
        return truckRepository.save(truck);
    }
}
