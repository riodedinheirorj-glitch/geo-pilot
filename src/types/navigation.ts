export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface NavigationRoute {
  origin: LatLngLiteral;
  destination: LatLngLiteral;
  waypoints?: LatLngLiteral[];
  distance?: number;
  duration?: number;
  totalDistance?: number;
  totalDuration?: number;
  geometry?: any;
  steps?: Array<{
    startLocation: LatLngLiteral;
    endLocation: LatLngLiteral;
    polyline?: LatLngLiteral[];
  }>;
}
