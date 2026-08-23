package com.fleetvane.shared.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class BusinessMetrics {

    private final Counter shipmentCreatedCounter;
    private final Counter shipmentDeliveredCounter;
    private final Counter shipmentCancelledCounter;
    private final Counter optimizationStartedCounter;
    private final Counter optimizationCompletedCounter;
    private final Counter optimizationFailedCounter;

    public BusinessMetrics(MeterRegistry registry) {
        this.shipmentCreatedCounter = Counter.builder("fleetvane.shipment.created")
                .description("Total number of shipments created")
                .register(registry);

        this.shipmentDeliveredCounter = Counter.builder("fleetvane.shipment.delivered")
                .description("Total number of shipments delivered")
                .register(registry);

        this.shipmentCancelledCounter = Counter.builder("fleetvane.shipment.cancelled")
                .description("Total number of shipments cancelled")
                .register(registry);

        this.optimizationStartedCounter = Counter.builder("fleetvane.optimization.started")
                .description("Total number of route optimization jobs started")
                .register(registry);

        this.optimizationCompletedCounter = Counter.builder("fleetvane.optimization.completed")
                .description("Total number of route optimization jobs completed")
                .register(registry);

        this.optimizationFailedCounter = Counter.builder("fleetvane.optimization.failed")
                .description("Total number of route optimization jobs failed")
                .register(registry);
    }

    public void incrementShipmentCreated() {
        shipmentCreatedCounter.increment();
    }

    public void incrementShipmentDelivered() {
        shipmentDeliveredCounter.increment();
    }

    public void incrementShipmentCancelled() {
        shipmentCancelledCounter.increment();
    }

    public void incrementOptimizationStarted() {
        optimizationStartedCounter.increment();
    }

    public void incrementOptimizationCompleted() {
        optimizationCompletedCounter.increment();
    }

    public void incrementOptimizationFailed() {
        optimizationFailedCounter.increment();
    }
}
