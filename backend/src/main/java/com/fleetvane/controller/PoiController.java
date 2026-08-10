package com.fleetvane.controller;

import com.fleetvane.service.PoiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pois")
@RequiredArgsConstructor
public class PoiController {

    private final PoiService poiService;

    @GetMapping("/fuel")
    public ResponseEntity<String> getFuelStations(
            @RequestParam Double minLat,
            @RequestParam Double minLng,
            @RequestParam Double maxLat,
            @RequestParam Double maxLng) {
        return ResponseEntity.ok(poiService.getFuelStationsNearRoute(minLat, minLng, maxLat, maxLng));
    }
}
