package com.evfinder.controller;

import com.evfinder.model.Charger;
import com.evfinder.repository.ChargerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chargers")
public class ChargerController {

    @Autowired
    ChargerRepository chargerRepository;

    @Autowired
    com.evfinder.service.ApiNinjasService apiNinjasService;

    @GetMapping
    public List<Charger> getAllChargers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String plugType,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        if (lat != null && lng != null) {
            System.out.println("[CONTROLLER] Incoming coordinates: lat=" + lat + ", lng=" + lng);
            // Fetch fresh data for this location (radius 25km)
            apiNinjasService.fetchAndSaveChargers(lat, lng, 25.0);
            List<Charger> results = chargerRepository.findNearbyChargers(lat, lng, 25.0);
            System.out
                    .println("[CONTROLLER] Returning " + results.size() + " enabled chargers near " + lat + "," + lng);
            return results; // Already filtered by enabled=true in query
        }

        if (status != null) {
            return chargerRepository.findByStatus(status).stream()
                    .filter(c -> Boolean.TRUE.equals(c.getEnabled()))
                    .collect(java.util.stream.Collectors.toList());
        }
        if (plugType != null) {
            return chargerRepository.findByPlugType(plugType).stream()
                    .filter(c -> Boolean.TRUE.equals(c.getEnabled()))
                    .collect(java.util.stream.Collectors.toList());
        }
        // Default: return only enabled chargers
        return chargerRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getEnabled()))
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Charger> getChargerById(@PathVariable Long id) {
        return chargerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Charger createCharger(@RequestBody Charger charger) {
        return chargerRepository.save(charger);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getChargerStats() {
        long total = chargerRepository.count();
        long available = chargerRepository.findByStatus("AVAILABLE").size();
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("total", total);
        stats.put("available", available);
        stats.put("users", 1200 + (total * 2)); // Mocking some user growth relative to data
        return ResponseEntity.ok(stats);
    }
}
