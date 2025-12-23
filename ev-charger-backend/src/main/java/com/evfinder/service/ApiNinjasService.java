package com.evfinder.service;

import com.evfinder.model.Charger;
import com.evfinder.repository.ChargerRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
public class ApiNinjasService {

    @Value("${apininjas.api.key}")
    private String apiKey;

    @Value("${apininjas.api.url}")
    private String apiUrl;

    private final ChargerRepository chargerRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ApiNinjasService(ChargerRepository chargerRepository) {
        this.chargerRepository = chargerRepository;
    }

    public List<Charger> fetchAndSaveChargers(double latParam, double lonParam, double distance) {
        // Removing 'limit' parameter as it is for premium users only and causing 400
        // error
        String url = String.format(java.util.Locale.US, "%s?lat=%f&lon=%f&distance=%f", apiUrl, latParam, lonParam,
                distance);

        System.out.println("[SYNC] Requesting API Ninjas: " + url);

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            System.out.println("[SYNC] API Ninjas Response Code: " + response.getStatusCode());

            if (response.getBody() == null || response.getBody().isEmpty()) {
                System.out.println("[SYNC] Empty response body from API Ninjas.");
                return new ArrayList<>();
            }

            JsonNode root = objectMapper.readTree(response.getBody());

            List<Charger> newChargers = new ArrayList<>();

            if (root.isArray()) {
                System.out.println("[SYNC] Found " + root.size() + " chargers in API response.");
                for (JsonNode node : root) {
                    try {
                        String name = node.path("name").asText("Unknown Charger");
                        double lat = node.path("latitude").asDouble();
                        double lon = node.path("longitude").asDouble();
                        String address = node.path("address").asText("");
                        String country = node.path("country").asText("IN"); // Default to India if missing

                        String plugType = "Unknown";
                        JsonNode connections = node.path("connections");
                        if (connections.isArray() && connections.size() > 0) {
                            plugType = connections.get(0).path("type_name").asText("Unknown");
                        }

                        String status = node.path("is_active").asBoolean(true) ? "AVAILABLE" : "OFFLINE";

                        // Check if charger exists (by name or exact coordinates)
                        List<Charger> existing = chargerRepository.findByLatitudeAndLongitude(lat, lon);
                        if (!existing.isEmpty()) {
                            // Update existing charger status in real-time
                            Charger c = existing.get(0);
                            c.setStatus(status);
                            c.setAddress(address);
                            c.setCountry(country);
                            chargerRepository.save(c);
                        } else {
                            // New charger found with localized default price (approx 15 INR)
                            Charger charger = new Charger(null, name, lat, lon, address, country, plugType, status,
                                    15.0, true);
                            newChargers.add(charger);
                        }
                    } catch (Exception e) {
                        System.err.println("[SYNC] Error parsing individual charger: " + e.getMessage());
                    }
                }
            } else {
                System.out.println("[SYNC] Unexpected non-array response: " + response.getBody());
            }

            if (!newChargers.isEmpty()) {
                List<Charger> saved = chargerRepository.saveAll(newChargers);
                System.out.println("[SYNC] Successfully saved " + saved.size() + " new chargers to DB.");
                return saved;
            } else {
                System.out.println("[SYNC] No new unique chargers to save.");
                return new ArrayList<>();
            }

        } catch (Exception e) {
            System.err.println("[SYNC] Critical Error: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
