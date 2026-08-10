package com.fleetvane.solver;

import ai.timefold.solver.core.api.solver.SolverManager;
import ai.timefold.solver.core.api.solver.SolverJob;
import com.fleetvane.model.Delivery;
import com.fleetvane.model.Truck;
import com.fleetvane.repository.DeliveryRepository;
import com.fleetvane.repository.TruckRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class RouteSolverService {

    private final SolverManager<VehicleRoutePlan, Long> solverManager;
    private final DeliveryRepository deliveryRepository;
    private final TruckRepository truckRepository;

    public RouteSolverService(SolverManager<VehicleRoutePlan, Long> solverManager,
                              DeliveryRepository deliveryRepository,
                              TruckRepository truckRepository) {
        this.solverManager = solverManager;
        this.deliveryRepository = deliveryRepository;
        this.truckRepository = truckRepository;
    }

    @Transactional
    public void optimizeRoute(Long truckId, List<Delivery> deliveries) {
        if (deliveries == null || deliveries.isEmpty()) {
            return;
        }

        Truck truck = truckRepository.findById(truckId)
                .orElseThrow(() -> new RuntimeException("Truck not found"));

        TruckNode truckNode = TruckNode.builder()
                .id(truck.getId())
                .lat(truck.getLat())
                .lng(truck.getLng())
                .build();

        List<DeliveryStop> stops = deliveries.stream()
                .map(d -> DeliveryStop.builder()
                        .id(d.getId())
                        .lat(d.getLat())
                        .lng(d.getLng())
                        .delivery(d)
                        .build())
                .collect(Collectors.toList());

        VehicleRoutePlan problem = VehicleRoutePlan.builder()
                .trucks(List.of(truckNode))
                .deliveries(stops)
                .build();

        Long problemId = truckId;
        SolverJob<VehicleRoutePlan, Long> solverJob = solverManager.solve(problemId, problem);
        
        try {
            VehicleRoutePlan solution = solverJob.getFinalBestSolution();
            
            Map<RouteNode, DeliveryStop> nextMap = new HashMap<>();
            for (DeliveryStop stop : solution.getDeliveries()) {
                if (stop.getPreviousStop() != null) {
                    nextMap.put(stop.getPreviousStop(), stop);
                }
            }
            
            RouteNode current = truckNode;
            int order = 1;
            while (nextMap.containsKey(current)) {
                DeliveryStop nextStop = nextMap.get(current);
                Delivery deliveryToUpdate = nextStop.getDelivery();
                deliveryToUpdate.setSequenceOrder(order++);
                deliveryRepository.save(deliveryToUpdate);
                current = nextStop;
            }
        } catch (Exception e) {
            throw new RuntimeException("Routing failed", e);
        }
    }
}
