package com.civica.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * GeoJSON Point representation for MongoDB 2dsphere indexing.
 * Stored as: { "type": "Point", "coordinates": [longitude, latitude] }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoJsonPoint {

    private String type = "Point";
    private List<Double> coordinates; // [longitude, latitude]

    public GeoJsonPoint(double longitude, double latitude) {
        this.type = "Point";
        this.coordinates = List.of(longitude, latitude);
    }

    public double getLongitude() {
        return coordinates != null && coordinates.size() >= 2 ? coordinates.get(0) : 0;
    }

    public double getLatitude() {
        return coordinates != null && coordinates.size() >= 2 ? coordinates.get(1) : 0;
    }
}
