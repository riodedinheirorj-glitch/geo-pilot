"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, CheckCircle2, ChevronRight } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ImportedData } from "@/pages/Index";

// Mapbox public token
mapboxgl.accessToken = "pk.eyJ1IjoicGFpdmEwMDciLCJhIjoiY21pYm4yOHphMDNocTJqb2w5OTlhZWk5bCJ9.nYQcx0AWey8p5P2R1mWJQQ";

interface LocationAdjustmentProps {
  onNavigate: (screen: string) => void;
  importedData: ImportedData | null;
  onUpdateData: (data: ImportedData) => void;
}

const LocationAdjustment = ({ onNavigate, importedData, onUpdateData }: LocationAdjustmentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [localData, setLocalData] = useState<ImportedData | null>(importedData);

  useEffect(() => {
    if (!mapContainer.current || !localData) return;

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-43.67, -22.95],
        zoom: 12,
        attributionControl: false,
      });
    }

    const map = mapRef.current;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoords = false;

    localData.rows.forEach((row, index) => {
      const lat = parseFloat(String(row["Latitude"] || "").replace(',', '.'));
      const lng = parseFloat(String(row["Longitude"] || "").replace(',', '.'));

      if (!isNaN(lat) && !isNaN(lng)) {
        hasValidCoords = true;
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:24px;height:24px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:grab;"><div style="width:6px;height:6px;background:white;border-radius:50%;"></div></div>`;

        const marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat([lng, lat])
          .addTo(map);

        marker.on('dragend', () => {
          const newLngLat = marker.getLngLat();
          const updatedRows = [...localData.rows];
          updatedRows[index] = {
            ...updatedRows[index],
            Latitude: newLngLat.lat.toString(),
            Longitude: newLngLat.lng.toString()
          };
          const newData = { ...localData, rows: updatedRows };
          setLocalData(newData);
          onUpdateData(newData);
        });

        markersRef.current.push(marker);
        bounds.extend([lng, lat]);
      }
    });

    if (hasValidCoords) {
      // Collect valid coordinates
      const validCoords: [number, number][] = [];
      localData.rows.forEach((row) => {
        const lat = parseFloat(String(row["Latitude"] || "").replace(',', '.'));
        const lng = parseFloat(String(row["Longitude"] || "").replace(',', '.'));
        if (!isNaN(lat) && !isNaN(lng)) validCoords.push([lng, lat]);
      });

      // Check if addresses are spread out by measuring bounds span
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latSpan = ne.lat - sw.lat;
      const lngSpan = ne.lng - sw.lng;
      const isSpreadOut = latSpan > 0.05 || lngSpan > 0.05; // ~5km spread

      if (isSpreadOut && validCoords.length > 3) {
        // Find the densest cluster: for each point, count neighbors within ~1km
        const clusterRadius = 0.01; // ~1km in degrees
        let bestCenter: [number, number] = validCoords[0];
        let bestCount = 0;

        validCoords.forEach((coord) => {
          const count = validCoords.filter(
            (c) => Math.abs(c[0] - coord[0]) < clusterRadius && Math.abs(c[1] - coord[1]) < clusterRadius
          ).length;
          if (count > bestCount) {
            bestCount = count;
            bestCenter = coord;
          }
        });

        // Build bounds around the largest cluster
        const clusterBounds = new mapboxgl.LngLatBounds();
        validCoords.forEach((c) => {
          if (Math.abs(c[0] - bestCenter[0]) < clusterRadius && Math.abs(c[1] - bestCenter[1]) < clusterRadius) {
            clusterBounds.extend(c);
          }
        });

        map.fitBounds(clusterBounds, { padding: 60, duration: 1000, maxZoom: 16 });
      } else {
        // All close together — zoom in to street level
        map.fitBounds(bounds, { padding: 40, duration: 1000, maxZoom: 16 });
      }
    }
  }, [localData?.totalAddresses]);

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9]">
      {/* Mapa - 80% da tela */}
      <div className="relative w-full" style={{ height: '80%' }}>
        <div ref={mapContainer} className="w-full h-full" />
        {/* Dica flutuante sobre o mapa */}
        <div className="absolute top-3 left-3 right-3 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm flex items-center gap-2">
            <MapPin size={14} className="text-blue-500 shrink-0" />
            <span className="text-xs text-gray-600 font-medium">Arraste os pins para corrigir as localizações</span>
          </div>
        </div>
      </div>

      {/* Rodapé compacto */}
      <div className="flex-1 flex flex-col justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-500" />
            <span className="text-sm text-gray-700">
              <span className="font-bold">{localData?.totalAddresses || 0}</span> endereços
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-500" />
            <span className="text-sm text-gray-700">
              <span className="font-bold">{localData?.duplicates || 0}</span> duplicados
            </span>
          </div>
        </div>

        <button 
          onClick={() => onNavigate("route")}
          className="w-full gradient-primary text-white font-bold text-base py-3.5 rounded-[18px] shadow-button flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          INICIAR NAVEGAÇÃO <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default LocationAdjustment;