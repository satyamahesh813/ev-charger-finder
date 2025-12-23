package com.evfinder.repository;

import com.evfinder.model.Charger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargerRepository extends JpaRepository<Charger, Long> {
        List<Charger> findByStatus(String status);

        List<Charger> findByPlugType(String plugType);

        List<Charger> findByLatitudeAndLongitude(double latitude, double longitude);

        @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM chargers c WHERE " +
                        "c.enabled = true AND " +
                        "(6371 * acos(cos(radians(:lat)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(:lng)) + "
                        +
                        "sin(radians(:lat)) * sin(radians(c.latitude)))) <= :distance " +
                        "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(:lng)) + "
                        +
                        "sin(radians(:lat)) * sin(radians(c.latitude)))) ASC", nativeQuery = true)
        List<Charger> findNearbyChargers(@org.springframework.data.repository.query.Param("lat") double lat,
                        @org.springframework.data.repository.query.Param("lng") double lng,
                        @org.springframework.data.repository.query.Param("distance") double distance);
}
