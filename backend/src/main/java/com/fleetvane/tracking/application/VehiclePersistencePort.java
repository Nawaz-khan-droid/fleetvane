package com.fleetvane.tracking.application;

/**
 * Port owned by the tracking module for persisting vehicle telemetry.
 *
 * Implemented by an adapter inside the {@code fleet} module, keeping tracking
 * decoupled from fleet's entity/repository internals (no module cycles).
 */
public interface VehiclePersistencePort {

    /** @return true if the vehicle exists (used to validate history reads). */
    boolean vehicleExists(long vehicleId);

    /**
     * Persists the latest position onto the vehicle aggregate.
     * Null heading is normalised by implementations.
     */
    void applyGpsLocation(long vehicleId, double lat, double lng, Double heading);
}
