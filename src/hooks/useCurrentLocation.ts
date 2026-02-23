import { useState, useEffect, useRef, useCallback } from "react";

interface UseCurrentLocationOptions {
  autoRequest?: boolean;
  mode?: "single" | "watch";
}

interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function useCurrentLocation(options?: UseCurrentLocationOptions) {
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setIsLoadingLocation(false);
        setPermissionState("granted");
      },
      (err) => {
        setLocationError(err.message);
        setIsLoadingLocation(false);
        if (err.code === err.PERMISSION_DENIED) setPermissionState("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const refreshPermissionState = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setPermissionState(result.state as any);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshPermissionState();
    if (options?.autoRequest) requestLocation();
  }, []);

  return { currentLocation, isLoadingLocation, locationError, permissionState, refreshPermissionState, requestLocation };
}
