import { EvacuationRouteResult } from './routingTypes';
import { HazardZonePolygon } from './hazardCheck';
import { sanitizeFilename } from '@/lib/sanitize';

/**
 * Generates an RFC 7946 compliant GeoJSON FeatureCollection containing
 * the evacuation route polyline, origin/destination points, spillover branch,
 * and associated hazard zone polygons for direct import into GIS software (QGIS/ArcGIS).
 */
export function generateEvacuationRouteGeoJSON(
  route: EvacuationRouteResult,
  hazardZones: HazardZonePolygon[] = []
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  // 1. Primary Evacuation Route Polyline (LineString: [lng, lat])
  features.push({
    type: 'Feature',
    id: 'route-primary',
    geometry: {
      type: 'LineString',
      coordinates: route.geoJsonCoordinates,
    },
    properties: {
      name: `Rute Evakuasi Pejalan Kaki: ${route.origin.name} ke ${route.destination.name}`,
      category: 'evacuation_route_primary',
      originName: route.origin.name,
      destinationName: route.destination.name,
      distanceMeters: route.distanceMeters,
      distanceKm: parseFloat((route.distanceMeters / 1000).toFixed(2)),
      durationSeconds: route.durationSeconds,
      durationMinutes: Math.max(1, Math.round(route.durationSeconds / 60)),
      hazardSeverity: route.hazardSeverity || 'none',
      hazardCheckStatus: route.hazardCheckStatus,
      isDetourRoute: Boolean(route.isDetourRoute),
      detourReason: route.detourReason || null,
      impedanceMultiplier: route.impedanceMultiplier || 1.0,
      offlineMode: Boolean(route.offlineMode),
      provider: route.provider,
      profile: route.profile,
      calculatedAt: route.calculatedAt || new Date().toISOString(),
    },
  });

  // 2. Secondary Overflow Spillover Route if Allocated (LineString)
  if (
    route.capacityAllocation &&
    route.capacityAllocation.secondaryRouteGeometry &&
    route.capacityAllocation.secondaryRouteGeometry.length > 1 &&
    route.capacityAllocation.secondaryDestination
  ) {
    const secGeoJsonCoords = route.capacityAllocation.secondaryRouteGeometry.map(
      ([lat, lng]) => [lng, lat]
    );

    features.push({
      type: 'Feature',
      id: 'route-spillover-secondary',
      geometry: {
        type: 'LineString',
        coordinates: secGeoJsonCoords,
      },
      properties: {
        name: `Rute Limpasan Kapasitas ke ${route.capacityAllocation.secondaryDestination.name}`,
        category: 'evacuation_route_spillover',
        primaryTes: route.destination.name,
        secondaryTes: route.capacityAllocation.secondaryDestination.name,
        spilloverEvacuees: route.capacityAllocation.secondaryAllocatedCount,
        occupancyPercentagePrimary: route.capacityAllocation.occupancyPercentage,
      },
    });
  }

  // 3. Origin Point (Point: [lng, lat])
  features.push({
    type: 'Feature',
    id: 'origin-point',
    geometry: {
      type: 'Point',
      coordinates: [route.origin.lng, route.origin.lat],
    },
    properties: {
      name: route.origin.name,
      category: 'origin_point',
      originType: route.origin.type,
      latitude: route.origin.lat,
      longitude: route.origin.lng,
    },
  });

  // 4. Primary Destination TES Point (Point: [lng, lat])
  features.push({
    type: 'Feature',
    id: 'destination-tes-primary',
    geometry: {
      type: 'Point',
      coordinates: [route.destination.lng, route.destination.lat],
    },
    properties: {
      name: route.destination.name,
      category: 'destination_tes',
      district: route.destination.districtName,
      capacity: route.destination.capacity ?? null,
      elevationM: route.destination.elevationM ?? null,
      source: route.destination.sourceName,
      verificationStatus: route.destination.verificationStatus,
      latitude: route.destination.lat,
      longitude: route.destination.lng,
    },
  });

  // 5. Secondary TES Point if Available
  if (route.capacityAllocation?.secondaryDestination) {
    const secDest = route.capacityAllocation.secondaryDestination;
    features.push({
      type: 'Feature',
      id: 'destination-tes-secondary',
      geometry: {
        type: 'Point',
        coordinates: [secDest.lng, secDest.lat],
      },
      properties: {
        name: secDest.name,
        category: 'destination_tes_secondary',
        district: secDest.districtName,
        capacity: secDest.capacity ?? null,
        elevationM: secDest.elevationM ?? null,
        source: secDest.sourceName,
        verificationStatus: secDest.verificationStatus,
        latitude: secDest.lat,
        longitude: secDest.lng,
      },
    });
  }

  // 6. Hazard Zones Polygons (Polygons: [[lng, lat], ...])
  hazardZones.forEach((zone, idx) => {
    if (zone.polygon && zone.polygon.length >= 3) {
      const ring = zone.polygon.map(([lat, lng]) => [lng, lat]);
      // Ensure closing vertex for GeoJSON linear ring RFC 7946 compliance
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }

      features.push({
        type: 'Feature',
        id: `hazard-zone-${idx + 1}`,
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
        properties: {
          name: zone.name,
          category: 'simulated_hazard_zone',
          severity: zone.severity,
          hazardType: zone.type || 'SIMULATED_HAZARD',
        },
      });
    }
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Triggers a browser download of the GeoJSON FeatureCollection.
 */
export function exportRouteToGeoJSONFile(
  route: EvacuationRouteResult,
  hazardZones: HazardZonePolygon[] = []
): void {
  const geojson = generateEvacuationRouteGeoJSON(route, hazardZones);
  const jsonString = JSON.stringify(geojson, null, 2);
  const blob = new Blob([jsonString], { type: 'application/geo+json;charset=utf-8' });

  const safeDestName = sanitizeFilename(route.destination.name, 'TES');
  const filename = `DisasterSim-Rute-${safeDestName}.geojson`;

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
