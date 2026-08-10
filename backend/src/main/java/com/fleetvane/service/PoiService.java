package com.fleetvane.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PoiService {

    private final RestTemplate restTemplate = new RestTemplate();

    public String getFuelStationsNearRoute(Double minLat, Double minLng, Double maxLat, Double maxLng) {
        String overpassUrl = "http://overpass-api.de/api/interpreter?data=[out:json];node[\"amenity\"=\"fuel\"](" 
                + minLat + "," + minLng + "," + maxLat + "," + maxLng + ");out;";
        try {
            return restTemplate.getForObject(overpassUrl, String.class);
        } catch (Exception e) {
            return "{\"elements\": []}";
        }
    }
}
