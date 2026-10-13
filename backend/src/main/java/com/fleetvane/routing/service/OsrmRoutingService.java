package com.fleetvane.routing.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * Service that fetches real road-network routes and geometry from OSRM (Open Source Routing Machine).
 * Converts OSRM's GeoJSON [lng, lat] coordinate arrays into standard [lat, lng] coordinates for mapping.
 * Falls back to Haversine straight-line interpolation if the external OSRM service is unreachable.
 */
@Service
public class OsrmRoutingService {

    private static final Logger log = LoggerFactory.getLogger(OsrmRoutingService.class);

    private final RestClient restClient;
    private final String baseUrl;

    public record RouteResult(
            List<double[]> geometry,
            double distanceMeters,
            double durationSeconds
    ) {}

    public OsrmRoutingService(
            @Value("${routing.osrm.base-url:https://router.project-osrm.org}") String baseUrl) {
        this.baseUrl = baseUrl.replaceAll("/+$", "");

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));

        this.restClient = RestClient.builder()
                .baseUrl(this.baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Solves road route for an ordered list of waypoints (each waypoint is [lat, lng]).
     */
    public RouteResult getRoute(List<double[]> waypoints) {
        if (waypoints == null || waypoints.size() < 2) {
            return new RouteResult(waypoints != null ? waypoints : Collections.emptyList(), 0.0, 0.0);
        }

        try {
            // OSRM expects coordinates in lng,lat order separated by semicolons:
            // /route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson
            StringBuilder coordsBuilder = new StringBuilder();
            for (int i = 0; i < waypoints.size(); i++) {
                if (i > 0) {
                    coordsBuilder.append(";");
                }
                double[] wp = waypoints.get(i);
                // format with US locale to guarantee '.' decimal separator
                coordsBuilder.append(String.format(Locale.US, "%.6f,%.6f", wp[1], wp[0]));
            }

            String path = String.format("/route/v1/driving/%s?overview=full&geometries=geojson&steps=false",
                    coordsBuilder.toString());

            OsrmResponse response = restClient.get()
                    .uri(path)
                    .retrieve()
                    .body(OsrmResponse.class);

            if (response != null && "Ok".equalsIgnoreCase(response.code()) && response.routes() != null && !response.routes().isEmpty()) {
                OsrmRoute best = response.routes().get(0);
                List<double[]> latLngGeometry = new ArrayList<>();

                if (best.geometry() != null && best.geometry().coordinates() != null) {
                    for (double[] coord : best.geometry().coordinates()) {
                        // OSRM GeoJSON is [lng, lat] -> convert to [lat, lng]
                        if (coord.length >= 2) {
                            latLngGeometry.add(new double[]{coord[1], coord[0]});
                        }
                    }
                }

                if (latLngGeometry.isEmpty()) {
                    latLngGeometry.addAll(waypoints);
                }

                return new RouteResult(
                        latLngGeometry,
                        best.distance() != null ? best.distance() : calculateHaversineTotalMeters(waypoints),
                        best.duration() != null ? best.duration() : 0.0
                );
            }
        } catch (Exception ex) {
            log.warn("OSRM routing service unavailable, falling back to direct line: {}", ex.getMessage());
        }

        return fallbackDirectRoute(waypoints);
    }

    private RouteResult fallbackDirectRoute(List<double[]> waypoints) {
        double totalMeters = calculateHaversineTotalMeters(waypoints);
        // Estimate 40 km/h average driving speed
        double speedMps = 40.0 * 1000.0 / 3600.0;
        double durationSeconds = speedMps > 0 ? totalMeters / speedMps : 0.0;
        return new RouteResult(new ArrayList<>(waypoints), totalMeters, durationSeconds);
    }

    private double calculateHaversineTotalMeters(List<double[]> waypoints) {
        double total = 0.0;
        for (int i = 0; i < waypoints.size() - 1; i++) {
            double[] p1 = waypoints.get(i);
            double[] p2 = waypoints.get(i + 1);
            total += haversineMeters(p1[0], p1[1], p2[0], p2[1]);
        }
        return total;
    }

    public static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371000.0; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OsrmResponse(
            String code,
            List<OsrmRoute> routes
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OsrmRoute(
            Double distance,
            Double duration,
            OsrmGeometry geometry
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OsrmGeometry(
            String type,
            List<double[]> coordinates
    ) {}
}
