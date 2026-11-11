import { EvacuationDestination } from '@/types/disaster';

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface RouteOrigin {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  type: 'city' | 'coast' | 'custom' | 'point';
}

export type HazardCheckStatus = 'intersects' | 'no_intersection_detected' | 'unknown';
export type HazardSeverityLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface TurnByTurnStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  streetName: string;
  maneuverType: string;
  modifier?: string;
}

export interface CapacityAllocationResult {
  totalEvacuees: number;
  primaryTesCapacity: number;
  primaryCapacity: number;
  primaryTesOccupancyRate: number; // e.g. 100% or 65%
  occupancyPercentage: number;
  allocatedCount: number;
  isOverCapacity: boolean;
  spilloverCount: number;
  secondaryAllocatedCount: number;
  secondaryTes?: EvacuationDestination;
  secondaryDestination?: EvacuationDestination;
  secondaryRouteGeometry?: [number, number][]; // [lat, lng] array
  secondaryDistanceMeters?: number;
  secondaryDurationSeconds?: number;
}

export interface EvacuationRouteResult {
  success: boolean;
  origin: RouteOrigin;
  destination: EvacuationDestination;
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][]; // [lat, lng] array for Leaflet polyline
  geoJsonCoordinates: [number, number][]; // [lng, lat] GeoJSON array
  hazardCheckStatus: HazardCheckStatus;
  hazardCheckNote: string;
  hazardSeverity: HazardSeverityLevel;
  hazardDetails: string[];
  isDetourRoute?: boolean;
  detourReason?: string;
  impedanceMultiplier?: number;
  turnByTurnSteps?: TurnByTurnStep[];
  capacityAllocation?: CapacityAllocationResult;
  offlineMode?: boolean;
  offlineNotice?: string;
  provider: string;
  profile: string;
  calculatedAt: string;
  error?: string;
}

export interface OSRMStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: {
    bearing_after: number;
    bearing_before: number;
    location: [number, number];
    type: string;
    modifier?: string;
  };
}

export interface OSRMRouteResponse {
  code: string;
  message?: string;
  routes?: Array<{
    geometry: {
      coordinates: [number, number][]; // [lng, lat]
      type: string;
    };
    legs?: Array<{
      summary: string;
      weight: number;
      duration: number;
      distance: number;
      steps?: OSRMStep[];
    }>;
    weight_name?: string;
    weight?: number;
    duration: number;
    distance: number;
  }>;
  waypoints?: Array<{
    hint?: string;
    distance?: number;
    name?: string;
    location: [number, number];
  }>;
}
