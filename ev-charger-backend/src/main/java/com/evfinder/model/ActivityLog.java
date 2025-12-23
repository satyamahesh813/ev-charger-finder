package com.evfinder.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String adminEmail;
    private String action; // CREATE, UPDATE, DELETE, TOGGLE
    private String entityType; // USER, CHARGER
    private String entityId;
    private String details;
    private LocalDateTime timestamp;

    public ActivityLog(String adminEmail, String action, String entityType, String entityId, String details) {
        this.adminEmail = adminEmail;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }
}
