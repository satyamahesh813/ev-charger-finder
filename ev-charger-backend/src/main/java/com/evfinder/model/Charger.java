package com.evfinder.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chargers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Charger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Double latitude;
    private Double longitude;

    private String address;
    private String country;

    @Column(name = "plug_type")
    private String plugType; // CCS, Type2

    private String status; // AVAILABLE, OCCUPIED

    @Column(name = "price_per_kwh")
    private Double pricePerKwh;

    private Boolean enabled = true;
}
