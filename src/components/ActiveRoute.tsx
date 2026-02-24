import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Package, Phone, CheckCircle, XCircle, Loader2 } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ImportedData } from "@/pages/Index";

// Mapbox public token
mapboxgl.accessToken = "pk.eyJ1IjoicGFpdmEwMDciLCJhIjoiY21pYm4yOHphMDNocTJqb2w5OTlhZWk5bCJ9.nYQcx0AWey8p5P2R1mWJQQ";

interface ActiveRouteProps {
  onNavigate: (screen: string) => void;
  importedData: ImportedData | null;
}

const ActiveRoute = ({ onNavigate, importedData }: ActiveRouteProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [driverCoords, setDriverCoords] = useState<[number, number] | null>(null);

  // 1. Extração de dados reais da sua planilha (conforme a imagem)
  const currentRow = importedData?.rows[currentIndex];
  
  const currentAddress = currentRow ? String(currentRow["Destination Address"] || "") : "";
  const destLat = currentRow ? parseFloat(String(currentRow["Latitude"]).replace(',', '.')) : null;
  const destLng = currentRow ? parseFloat(String(currentRow["Longitude"]).replace(',', '.')) : null;
  
  const total = importedData?.totalAddresses || 0;
  const progress = currentIndex + 1;
  const percent = total > 0 ? (progress / total) * 100 : 0;

  // 2. Monitorar GPS real do motorista
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverCoords([pos.coords.longitude, pos.coords.latitude]);
        },
        (err) => console.error("Erro GPS:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // 3. Inicializar e atualizar o mapa com os dados da planilha
  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: driverCoords || (destLng && destLat ? [destLng, destLat] : [-43.67, -22.95]),
        zoom: 15,
        attributionControl: false,
      });
    }

    const map = mapRef.current;

    // Marcador do Motorista (Verde)
    if (driverCoords) {
      if (!driverMarkerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:32px;height:32px;background:#27AE60;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.2);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`;
        driverMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(driverCoords).addTo(map);
      } else {
        driverMarkerRef.current.setLngLat(driverCoords);
      }
    }

    // Marcador de Destino (Roxo/Azul) usando Latitude/Longitude da planilha
    if (destLng && destLat) {
      if (!destMarkerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:36px;height:36px;background:linear-gradient(135deg,#2F80ED,#7B61FF);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.2);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`;
        destMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat([destLng, destLat]).addTo(map);
      } else {
        destMarkerRef.current.setLngLat([destLng, destLat]);
      }

      // Ajustar visão para mostrar motorista e destino
      const bounds = new mapboxgl.LngLatBounds();
      if (driverCoords) bounds.extend(driverCoords);
      bounds.extend([destLng, destLat]);
      
      map.fitBounds(bounds, { padding: 60, duration: 1000 });
    }
  }, [driverCoords, destLat, destLng]);

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onNavigate("dashboard");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative" style={{ height: "340px" }}>
        <div ref={mapContainer} className="w-full h-full" />
        
        <button onClick={() => onNavigate("dashboard")} className="absolute top-4 left-4 w-9 h-9 bg-card rounded-full shadow-card flex items-center justify-center z-10">
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex-1 bg-background px-5 pt-4 pb-6 overflow-y-auto">
        <div className="bg-card rounded-[20px] shadow-card p-5 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Próxima parada</p>
          <h2 className="text-lg font-bold text-foreground mb-4 leading-tight">
            {currentAddress || "Endereço não identificado"}
          </h2>

          <div className="flex flex-col gap-2.5 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-500/10">
                <Package size={15} className="text-orange-500" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Pacotes: {currentRow?.["Sequence"] || "N/A"}
              </span>
            </div>
          </div>

          <div className="mb-1.5">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground font-medium">{progress}/{total} entregas</span>
            <span className="text-xs font-semibold text-primary">{Math.round(percent)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button className="bg-card rounded-[16px] shadow-card py-4 flex flex-col items-center justify-center gap-1.5">
            <Phone size={18} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Ligar</span>
          </button>
          <button onClick={handleNext} className="gradient-primary rounded-[16px] shadow-button py-4 flex flex-col items-center justify-center gap-1.5">
            <CheckCircle size={18} className="text-white" />
            <span className="text-xs font-bold text-white">Entregue</span>
          </button>
          <button onClick={handleNext} className="bg-card rounded-[16px] shadow-card py-4 flex flex-col items-center justify-center gap-1.5">
            <XCircle size={18} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Não entregue</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveRoute;