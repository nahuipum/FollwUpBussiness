package com.nahui.followupbussiness.routing.application.port.out;

import com.nahui.followupbussiness.customers.domain.GeoPoint;

import java.util.*;

/**
 * External adapter boundary: coordinates only, WGS84 lon/lat.
 */
public interface TravelMatrix {
    Matrix calculate(List<GeoPoint> coordinates);

    record Matrix(long[][] seconds, long[][] meters) {
    }
}
