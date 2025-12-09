import { LoadScript } from "@react-google-maps/api";
import { ReactNode } from "react";

interface GoogleMapsLoaderProps {
  children: ReactNode;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function GoogleMapsLoader({ children }: GoogleMapsLoaderProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg p-4">
        <p className="text-muted-foreground text-center">
          API Key do Google Maps não configurada. Por favor, configure VITE_GOOGLE_MAPS_API_KEY.
        </p>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      {children}
    </LoadScript>
  );
}
