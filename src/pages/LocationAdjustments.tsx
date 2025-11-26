import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { ProcessedAddress } from "@/lib/nominatim-service";
import AddressMapEditor from "@/components/AddressMapEditor";
import { toast } from "sonner";
import { buildLearningKey, saveLearnedLocation } from "@/lib/location-learning";
import { useIsMobile } from "@/hooks/use-mobile";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface LocationAdjustmentsState {
  initialProcessedData: ProcessedAddress[];
  totalOriginalSequences: number; // Adicionado para passar o total de pacotes
}

export default function LocationAdjustments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialProcessedData, totalOriginalSequences } = (location.state || {}) as LocationAdjustmentsState;

  const [addresses, setAddresses] = useState<ProcessedAddress[]>(initialProcessedData || []);
  const isMobile = useIsMobile();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ marker: maplibregl.Marker; index: number }[]>([]);

  useEffect(() => {
    if (!initialProcessedData || initialProcessedData.length === 0) {
      toast.error("Nenhum dado de endereço para ajustar. Por favor, faça o upload de uma planilha.");
      navigate("/");
    }
  }, [initialProcessedData, navigate]);

  // Initialize map with all pins
  useEffect(() => {
    if (!mapContainer.current || addresses.length === 0) return;
    if (map.current) return; // Initialize only once

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
      center: [-46.633309, -23.55052],
      zoom: 13
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add markers for all addresses
    const bounds = new maplibregl.LngLatBounds();
    
    addresses.forEach((address, index) => {
      const lat = parseFloat(address.latitude || '-23.55052');
      const lng = parseFloat(address.longitude || '-46.633309');

      // Skip invalid coordinates
      if (isNaN(lat) || isNaN(lng)) return;

      // Create marker with color based on status
      const markerColor = 
        address.status === 'valid' ? '#10b981' :
        address.status === 'corrected' || address.status === 'atualizado' ? '#3b82f6' :
        '#ef4444';

      const marker = new maplibregl.Marker({
        color: markerColor,
        draggable: true
      })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setHTML(`
          <div class="p-2 bg-white rounded-md shadow-md">
            <p class="font-semibold text-sm text-gray-900">${address.correctedAddress || address.originalAddress}</p>
            <p class="text-xs text-gray-600 mt-1">Arraste para ajustar</p>
          </div>
        `))
        .addTo(map.current!);

      // Handle drag end
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        handleMarkerDragEnd(index, lngLat.lat, lngLat.lng);
      });

      markers.current.push({ marker, index });
      bounds.extend([lng, lat]);
    });

    // Fit map to show all markers
    if (markers.current.length > 0) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }

    return () => {
      markers.current.forEach(({ marker }) => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [addresses.length]);

  const handleMarkerDragEnd = (index: number, lat: number, lng: number) => {
    setAddresses((prevAddresses) => {
      const newAddresses = [...prevAddresses];
      const updatedAddress = {
        ...newAddresses[index],
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        status: 'atualizado' as const,
        note: 'Ajustado no mapa',
        learned: true,
      };
      newAddresses[index] = updatedAddress;

      // Save to learning
      const learningKey = buildLearningKey(updatedAddress);
      saveLearnedLocation(learningKey, lat, lng);

      return newAddresses;
    });
    
    toast.success("Localização atualizada!");
  };

  const handleFinishAdjustments = () => {
    navigate("/", { state: { adjustedData: addresses, fromAdjustments: true, totalOriginalSequences: totalOriginalSequences } });
  };

  if (!initialProcessedData || initialProcessedData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando dados de ajuste...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-6 gap-4">
          <Button variant="outline" onClick={() => navigate("/")} className="flex items-center gap-2 w-full sm:w-auto" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-center">
            Ajuste de Localização
          </h1>
          <Button
            onClick={handleFinishAdjustments}
            className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 flex items-center gap-2 w-full sm:w-auto"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Finalizar e Exportar
          </Button>
        </div>

        <Card className="p-4 sm:p-6 border-2 border-primary/30 bg-card/50 backdrop-blur-sm shadow-lg shadow-primary/10">
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Endereços para Ajuste
            </h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Arraste os pins no mapa para ajustar as coordenadas
            </p>
          </div>

          {/* Interactive Map */}
          <div className="mb-6 rounded-lg overflow-hidden border-2 border-primary/30">
            <div ref={mapContainer} className="h-[400px] w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}