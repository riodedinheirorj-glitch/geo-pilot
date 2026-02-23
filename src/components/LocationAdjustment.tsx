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
      map.fitBounds(bounds, { padding: 40, duration: 1000 });
    }
  }, [localData?.totalAddresses]);

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9] px-4 py-6">
      {/* Card Principal */}
      <div className="bg-white rounded-[24px] shadow-sm overflow-hidden flex flex-col mb-4">
        {/* Header do Card */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <MapPin size={18} className="text-blue-500" />
            </div>
            <h1 className="text-[17px] font-bold text-gray-900">Ajustar Localizações</h1>
          </div>
          <span className="text-[13px] text-gray-400 font-medium">Arraste os pins para corrigir</span>
        </div>

        {/* Mapa */}
        <div className="relative h-[320px] w-full">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </div>

      {/* Card de Análise Concluída */}
      <div className="bg-white rounded-[24px] shadow-sm p-6 flex flex-col gap-5">
        <h2 className="text-[13px] font-bold text-blue-900/40 uppercase tracking-widest">Análise Concluída</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <p className="text-[16px] text-gray-900">
              <span className="font-bold">{localData?.totalAddresses || 0}</span> endereços reconhecidos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <p className="text-[16px] text-gray-900">
              <span className="font-bold">{localData?.duplicates || 0}</span> duplicados agrupados
            </p>
          </div>
        </div>
      </div>

      {/* Botão de Ação Inferior */}
      <div className="mt-auto pt-4">
        <button 
          onClick={() => onNavigate("route")}
          className="w-full gradient-primary text-white font-bold text-base py-4 rounded-[18px] shadow-button flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          INICIAR NAVEGAÇÃO <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default LocationAdjustment;