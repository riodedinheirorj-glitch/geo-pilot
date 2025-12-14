import React, { useState, useCallback } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { MapPin, Locate, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { geocodeSingleAddress } from "@/lib/nominatim-service";
import GoogleMapsLoader from "./GoogleMapsLoader";

interface AddressMapEditorProps {
  initialLat: number;
  initialLng: number;
  onSave: (coords: { lat: number; lng: number }) => void;
  onClose: () => void;
  addressName: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

function AddressMapEditorContent({
  initialLat,
  initialLng,
  onSave,
  onClose,
  addressName,
}: AddressMapEditorProps) {
  const [markerPosition, setMarkerPosition] = useState({
    lat: initialLat,
    lng: initialLng,
  });
  const [mapCenter, setMapCenter] = useState({
    lat: initialLat,
    lng: initialLng,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setMarkerPosition({ lat: newLat, lng: newLng });
      }
    },
    []
  );

  const handleSave = () => {
    onSave({ lat: markerPosition.lat, lng: markerPosition.lng });
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
        setMarkerPosition({ lat: latitude, lng: longitude });
        setMapCenter({ lat: latitude, lng: longitude });
        toast.success("Localização atualizada para sua posição GPS!");
        setIsLocating(false);
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        let errorMessage = "Erro ao obter sua localização.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage =
            "Permissão de geolocalização negada. Por favor, permita o acesso à localização nas configurações do seu navegador.";
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
      if (result) {
        const newLat = parseFloat(result.lat);
        const newLon = parseFloat(result.lon);
        setMarkerPosition({ lat: newLat, lng: newLon });
        setMapCenter({ lat: newLat, lng: newLon });
        toast.success(`Endereço encontrado: ${result.display_name}`);
      } else {
        toast.error(
          "Não foi possível encontrar o endereço. Tente ser mais específico."
        );
      }
    } catch (error) {
      console.error("Error searching address:", error);
      toast.error(
        "Erro ao buscar endereço. Verifique sua conexão ou tente novamente."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const getMarkerIcon = (color: string, isSelected: boolean) => {
    const scale = isSelected ? 1.3 : 1;
    return {
      path: google.maps.SymbolPath.DROP, // Alterado para formato de gota
      fillColor: isSelected ? "#fbbf24" : color,
      fillOpacity: 1,
      strokeColor: isSelected ? "#f59e0b" : "#ffffff",
      strokeWeight: isSelected ? 3 : 2,
      scale: 10 * scale,
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card p-6 rounded-xl w-full max-w-[600px] shadow-xl border border-primary/20">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Ajustar Localização
        </h2>
        <p className="text-sm text-muted-foreground mb-4">{addressName}</p>

        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Digite um endereço ou CEP para buscar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
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

        <div className="w-full h-[400px] rounded-lg overflow-hidden border border-primary/30 shadow-inner">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15} // Zoom inicial aumentado para 15
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              icon={getMarkerIcon("#10b981", true)} // Usando a função para o ícone
            />
          </GoogleMap>
        </div>

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

export default function AddressMapEditor(props: AddressMapEditorProps) {
  return (
    <GoogleMapsLoader>
      <AddressMapEditorContent {...props} />
    </GoogleMapsLoader>
  );
}