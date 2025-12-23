package com.evfinder.controller;

import com.evfinder.dto.BulkToggleRequest;
import com.evfinder.model.ActivityLog;
import com.evfinder.model.Charger;
import com.evfinder.model.User;
import com.evfinder.repository.ActivityLogRepository;
import com.evfinder.repository.ChargerRepository;
import com.evfinder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ChargerRepository chargerRepository;

    @Autowired
    ActivityLogRepository activityLogRepository;

    @Autowired
    PasswordEncoder encoder;

    private String getCurrentAdminEmail() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            return (auth != null) ? auth.getName() : "system";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private void logActivity(String action, String entityType, String entityId, String details) {
        try {
            activityLogRepository.save(new ActivityLog(getCurrentAdminEmail(), action, entityType, entityId, details));
        } catch (Exception e) {
            // Silently fail logging to avoid breaking core functionality
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    // USER MANAGEMENT

    @GetMapping("/users")
    public List<User> getAllUsers(@RequestParam(required = false) String search) {
        if (search != null && !search.isEmpty()) {
            String lowerSearch = search.toLowerCase();
            return userRepository.findAll().stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(lowerSearch)) ||
                            (u.getEmail() != null && u.getEmail().toLowerCase().contains(lowerSearch)))
                    .collect(Collectors.toList());
        }
        return userRepository.findAll();
    }

    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        user.setPassword(encoder.encode(user.getPassword()));
        if (user.getRole() == null)
            user.setRole("DRIVER");
        if (user.getEnabled() == null)
            user.setEnabled(true);
        User savedUser = userRepository.save(user);
        logActivity("CREATE", "USER", savedUser.getId().toString(), "Created user: " + savedUser.getEmail());
        return savedUser;
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setName(userDetails.getName());
            user.setEmail(userDetails.getEmail());
            user.setRole(userDetails.getRole());
            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                user.setPassword(encoder.encode(userDetails.getPassword()));
            }
            User updatedUser = userRepository.save(user);
            logActivity("UPDATE", "USER", id.toString(), "Updated user details for: " + updatedUser.getEmail());
            return ResponseEntity.ok(updatedUser);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            String email = user.getEmail();
            userRepository.delete(user);
            logActivity("DELETE", "USER", id.toString(), "Deleted user: " + email);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/users/{id}/toggle")
    public ResponseEntity<User> toggleUserStatus(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            boolean currentStatus = Boolean.TRUE.equals(user.getEnabled());
            user.setEnabled(!currentStatus);
            User updatedUser = userRepository.save(user);
            logActivity("TOGGLE", "USER", id.toString(),
                    "Toggled status to " + updatedUser.getEnabled() + " for: " + updatedUser.getEmail());
            return ResponseEntity.ok(updatedUser);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/users/bulk-toggle")
    public ResponseEntity<?> bulkToggleUsers(@RequestBody BulkToggleRequest request) {
        if (request == null || request.getIds() == null || request.getEnabled() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid request: ids and enabled status are required"));
        }

        List<User> allSelectedUsers = userRepository.findAllById(request.getIds());
        List<User> usersToToggle = allSelectedUsers.stream()
                .filter(u -> !"ADMIN".equals(u.getRole()))
                .collect(Collectors.toList());

        if (usersToToggle.isEmpty()) {
            return ResponseEntity.ok().body(Map.of("message", "No non-admin users found for the provided IDs"));
        }

        usersToToggle.forEach(u -> u.setEnabled(request.getEnabled()));
        userRepository.saveAll(usersToToggle);
        logActivity("BULK_TOGGLE", "USER", "N/A",
                "Bulk toggled status to " + request.getEnabled() + " for " + usersToToggle.size()
                        + " users (Admin users skipped)");
        return ResponseEntity.ok().build();
    }

    // CHARGER MANAGEMENT

    @GetMapping("/chargers")
    public List<Charger> getAllChargers(@RequestParam(required = false) String search) {
        if (search != null && !search.isEmpty()) {
            String lowerSearch = search.toLowerCase();
            return chargerRepository.findAll().stream()
                    .filter(c -> (c.getName() != null && c.getName().toLowerCase().contains(lowerSearch)) ||
                            (c.getAddress() != null && c.getAddress().toLowerCase().contains(lowerSearch)))
                    .collect(Collectors.toList());
        }
        return chargerRepository.findAll();
    }

    @PostMapping("/chargers")
    public Charger createCharger(@RequestBody Charger charger) {
        if (charger.getEnabled() == null)
            charger.setEnabled(true);
        Charger savedCharger = chargerRepository.save(charger);
        logActivity("CREATE", "CHARGER", savedCharger.getId().toString(), "Created charger: " + savedCharger.getName());
        return savedCharger;
    }

    @PutMapping("/chargers/{id}")
    public ResponseEntity<Charger> updateCharger(@PathVariable Long id, @RequestBody Charger chargerDetails) {
        return chargerRepository.findById(id).map(charger -> {
            charger.setName(chargerDetails.getName());
            charger.setLatitude(chargerDetails.getLatitude());
            charger.setLongitude(chargerDetails.getLongitude());
            charger.setAddress(chargerDetails.getAddress());
            charger.setCountry(chargerDetails.getCountry());
            charger.setPlugType(chargerDetails.getPlugType());
            charger.setStatus(chargerDetails.getStatus());
            charger.setPricePerKwh(chargerDetails.getPricePerKwh());
            Charger updatedCharger = chargerRepository.save(charger);
            logActivity("UPDATE", "CHARGER", id.toString(), "Updated charger: " + updatedCharger.getName());
            return ResponseEntity.ok(updatedCharger);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/chargers/{id}")
    public ResponseEntity<?> deleteCharger(@PathVariable Long id) {
        return chargerRepository.findById(id).map(charger -> {
            String name = charger.getName();
            chargerRepository.delete(charger);
            logActivity("DELETE", "CHARGER", id.toString(), "Deleted charger: " + name);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/chargers/{id}/toggle")
    public ResponseEntity<Charger> toggleChargerStatus(@PathVariable Long id) {
        return chargerRepository.findById(id).map(charger -> {
            boolean currentStatus = Boolean.TRUE.equals(charger.getEnabled());
            charger.setEnabled(!currentStatus);
            Charger updatedCharger = chargerRepository.save(charger);
            logActivity("TOGGLE", "CHARGER", id.toString(),
                    "Toggled status to " + updatedCharger.getEnabled() + " for: " + updatedCharger.getName());
            return ResponseEntity.ok(updatedCharger);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/chargers/bulk-toggle")
    public ResponseEntity<?> bulkToggleChargers(@RequestBody BulkToggleRequest request) {
        if (request == null || request.getIds() == null || request.getEnabled() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid request: ids and enabled status are required"));
        }

        List<Charger> chargers = chargerRepository.findAllById(request.getIds());
        if (chargers.isEmpty()) {
            return ResponseEntity.ok().body(Map.of("message", "No chargers found for the provided IDs"));
        }

        chargers.forEach(c -> c.setEnabled(request.getEnabled()));
        chargerRepository.saveAll(chargers);
        logActivity("BULK_TOGGLE", "CHARGER", "N/A",
                "Bulk toggled status to " + request.getEnabled() + " for " + chargers.size() + " chargers");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getEnabled())).count();
        long inactiveUsers = totalUsers - activeUsers;

        long totalChargers = chargerRepository.count();
        List<Charger> allChargers = chargerRepository.findAll();
        long activeChargers = allChargers.stream()
                .filter(c -> Boolean.TRUE.equals(c.getEnabled())).count();
        long inactiveChargers = totalChargers - activeChargers;

        Map<String, Long> chargerStatusBreakdown = allChargers.stream()
                .collect(Collectors.groupingBy(c -> c.getStatus() != null ? c.getStatus() : "UNKNOWN",
                        Collectors.counting()));

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "inactiveUsers", inactiveUsers,
                "totalChargers", totalChargers,
                "activeChargers", activeChargers,
                "inactiveChargers", inactiveChargers,
                "chargerStatusBreakdown", chargerStatusBreakdown));
    }

    @GetMapping("/logs")
    public List<ActivityLog> getRecentLogs() {
        return activityLogRepository.findTop10ByOrderByTimestampDesc();
    }
}
