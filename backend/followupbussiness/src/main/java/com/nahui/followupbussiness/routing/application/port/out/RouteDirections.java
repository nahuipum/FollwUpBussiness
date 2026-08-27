package com.nahui.followupbussiness.routing.application.port.out;

import com.nahui.followupbussiness.customers.domain.GeoPoint;
import java.util.List;

/** External road-detail boundary. Providers receive WGS84 coordinates only. */
public interface RouteDirections {
    Directions calculate(List<GeoPoint> coordinates);

    record Directions(List<GeoPoint> geometry, List<Leg> legs, long distanceMeters, long durationSeconds) {
        public Directions { geometry = List.copyOf(geometry); legs = List.copyOf(legs); }
    }
    record Leg(long distanceMeters, long durationSeconds, List<Instruction> instructions) {
        public Leg { instructions = List.copyOf(instructions); }
    }
    record Instruction(String text, long distanceMeters, long durationSeconds) { }
}
