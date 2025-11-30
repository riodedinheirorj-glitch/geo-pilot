import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { MapPin, Locate, Loader2, Search } from "lucide-react"; // Import Search icon
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input component
import { toast } from "sonner";
import { geocodeSingleAddress } from "@/lib/nominatim-service"; // Import geocodeSingleAddress

interface AddressMapEditorProps {
  initialLat: number;
  initialLng: number;
  onSave: (coords: { lat: number; lng: number }) => void;
  onClose: () => void;
  addressName: string;
}

export default function AddressMapEditor({
  initialLat,
  initialLng,
  onSave,
  onClose,
  addressName,
}: AddressMapEditorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // State for search input
  const [isSearching, setIsSearching] = useState(false); // State for search loading

  useEffect(() => {
    if (!mapContainer.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      // Usando Stadia Maps para dados mais atualizados.
      // Para uso em produção com alto volume, pode ser necessário um API Key do Stadia Maps.
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json", 
      center: [initialLng, initialLat],
      zoom: 16, // Aumentado o zoom para 16
    });

    markerRef.current = new maplibregl.Marker({ draggable: true })
      .setLngLat([initialLng, initialLat])
      .addTo(mapRef.current);

    mapRef.current.on('load', () => {
      mapRef.current?.resize();
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, [initialLat, initialLng]);

  const handleSave = () => {
    const lngLat = markerRef.current?.getLngLat();
    if (lngLat) {
      onSave({ lat: lngLat.lat, lng: lngLat.lng });
    }
    onClose();
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter([longitude, latitude]);
          markerRef.current.setLngLat([longitude, latitude]);
          toast.success("Localização atualizada para sua posição GPS!");
        }
        setIsLocating(false);
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        let errorMessage = "Erro ao obter sua localização.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Permissão de geolocalização negada. Por favor, permita o acesso à localização nas configurações do seu navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Informações de localização indisponíveis.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Tempo limite excedido ao tentar obter a localização.";
        }
        toast.error(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) {
      toast.info("Por favor, digite um endereço ou CEP para buscar.");
      return;
    }

    setIsSearching(true);
    try {
      const result = await geocodeSingleAddress(searchQuery);
      if (result && mapRef.current && markerRef.current) {
        const newLat = parseFloat(result.lat);
        const newLon = parseFloat(result.lon);
        mapRef.current.setCenter([newLon, newLat]);
        markerRef.current.setLngLat([newLon, newLat]);
        toast.success(`Endereço encontrado: ${result.display_name}`);
      } else {
        toast.error("Não foi possível encontrar o endereço. Tente ser mais específico.");
      }
    } catch (error) {
      console.error("Error searching address:", error);
      toast.error("Erro ao buscar endereço. Verifique sua conexão ou tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card p-6 rounded-xl w-full max-w-[600px] shadow-xl border border-primary/20">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Ajustar Localização
        </h2>
        <p className="text-sm text-muted-foreground mb-4">{addressName}</p>

        {/* New search input field */}
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Digite um endereço ou CEP para buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearchAddress();
              }
            }}
            disabled={isSearching}
          />
          <Button onClick={handleSearchAddress} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div
          ref={mapContainer}
          className="w-full h-[400px] rounded-lg overflow-hidden border border-primary/30 shadow-inner"
        />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleLocateMe}
            disabled={isLocating || isSearching}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            {isLocating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Localizando...
              </>
            ) : (
              <>
                <Locate className="h-4 w-4" />
                Minha Localização
              </>
            )}
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLocating || isSearching}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              disabled={isLocating || isSearching}
              className="w-full sm:w-auto"
            >
              Salvar Localização
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}