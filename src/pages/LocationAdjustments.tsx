import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, CheckCircle2, Locate, Loader2 } from "lucide-react";
import { ProcessedAddress, reverseGeocodeAddress } from "@/lib/nominatim-service";
import { toast } from "sonner";
import { buildLearningKey, saveLearnedLocation } from "@/lib/location-learning";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { ConfirmLocationSaveDialog } from "@/components/ConfirmLocationSaveDialog";
import GoogleMapsLoader from "@/components/GoogleMapsLoader";

interface LocationAdjustmentsState {
  initialProcessedData: ProcessedAddress[];
  totalOriginalSequences: number;
}

interface MarkerData {
  index: number;
  position: { lat: number; lng: number };
  originalPosition: { lat: number; lng: number };
  color: string;
  addressName: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

function LocationAdjustmentsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialProcessedData, totalOriginalSequences } = (location.state || {}) as LocationAdjustmentsState;

  const [addresses, setAddresses] = useState<ProcessedAddress[]>(initialProcessedData || []);
  const [markersData, setMarkersData] = useState<MarkerData[]>([]);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: -23.55052, lng: -46.633309 });
  const [mapZoom, setMapZoom] = useState(15);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogAddressDetails, setDialogAddressDetails] = useState<{
    index: number;
    addressName: string;
    newLat: number;
    newLng: number;
    originalLat: number;
    originalLng: number;
  } | null>(null);
  
  // Novo estado para o InfoWindow
  const [infoWindowData, setInfoWindowData] = useState<{
    position: { lat: number; lng: number };
    content: string;
    index: number;
  } | null>(null);

  useEffect(() => {
    if (!initialProcessedData || initialProcessedData.length === 0) {
      toast.error("Nenhum dado de endereço para ajustar. Por favor, faça o upload de uma planilha.");
      navigate("/");
    }
  }, [initialProcessedData, navigate]);

  useEffect(() => {
    if (addresses.length === 0) return;

    const newMarkersData: MarkerData[] = [];
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

    addresses.forEach((address, index) => {
      const lat = parseFloat(address.latitude || "-23.55052");
      const lng = parseFloat(address.longitude || "-46.633309");

      if (isNaN(lat) || isNaN(lng)) return;

      const color =
        address.status === "valid" ? "#10b981" :
        address.status === "corrected" || address.status === "atualizado" ? "#3b82f6" :
        "#ef4444";

      // Extrair nome do endereço para mostrar no InfoWindow
      const addressName = address.correctedAddress || address.originalAddress || `Endereço ${index + 1}`;

      newMarkersData.push({
        index,
        position: { lat, lng },
        originalPosition: { lat, lng },
        color,
        addressName,
      });

      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    setMarkersData(newMarkersData);

    if (newMarkersData.length > 0) {
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      setMapCenter({ lat: centerLat, lng: centerLng });
    }
  }, [addresses]);

  const handleMarkerClick = useCallback((clickedIndex: number) => {
    setSelectedMarkerIndex(prevIndex => {
      if (prevIndex !== null && prevIndex !== clickedIndex) {
        toast.info("Finalize ou cancele a seleção do pino atual antes de selecionar outro.");
        return prevIndex;
      }
      if (prevIndex === clickedIndex) {
        toast.info("Seleção de endereço cancelada.");
        return null;
      }
      toast.info(`Endereço selecionado: ${addresses[clickedIndex].correctedAddress || addresses[clickedIndex].originalAddress}. Agora você pode arrastar.`);
      return clickedIndex;
    });
  }, [addresses]);

  const handleMapClick = useCallback(() => {
    setSelectedMarkerIndex(null);
    setInfoWindowData(null); // Fechar InfoWindow ao clicar no mapa
  }, []);

  const handleMarkerDragEnd = useCallback(async (index: number, e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();

    const markerData = markersData.find(m => m.index === index);
    if (!markerData) return;

    const reverseGeocodeResult = await reverseGeocodeAddress(newLat, newLng);
    const originalAddressName = addresses[index].correctedAddress || addresses[index].originalAddress;
    const foundAddressName = reverseGeocodeResult?.display_name || originalAddressName;

    setDialogAddressDetails({
      index,
      addressName: foundAddressName,
      newLat,
      newLng,
      originalLat: markerData.originalPosition.lat,
      originalLng: markerData.originalPosition.lng,
    });
    setShowConfirmDialog(true);

    setMarkersData(prev =>
      prev.map(m =>
        m.index === index ? { ...m, position: { lat: newLat, lng: newLng } } : m
      )
    );
  }, [markersData, addresses]);

  // Função para lidar com o clique no marker (mostrar InfoWindow)
  const handleMarkerInfoClick = useCallback((index: number, position: { lat: number; lng: number }) => {
    const markerData = markersData.find(m => m.index === index);
    if (markerData) {
      setInfoWindowData({
        position,
        content: markerData.addressName,
        index
      });
    }
  }, [markersData]);

  const handleUseMyLocation = () => {
    if (selectedMarkerIndex === null) {
      toast.info("Por favor, selecione um pino no mapa primeiro.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setIsLocating(true);
    const markerData = markersData.find(m => m.index === selectedMarkerIndex);
    if (!markerData) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setMarkersData(prev =>
          prev.map(m =>
            m.index === selectedMarkerIndex
              ? { ...m, position: { lat: latitude, lng: longitude } }
              : m
          )
        );
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(16);

        const reverseGeocodeResult = await reverseGeocodeAddress(latitude, longitude);
        const foundAddressName = reverseGeocodeResult?.display_name || "Sua Localização Atual";

        setDialogAddressDetails({
          index: selectedMarkerIndex,
          addressName: foundAddressName,
          newLat: latitude,
          newLng: longitude,
          originalLat: markerData.originalPosition.lat,
          originalLng: markerData.originalPosition.lng,
        });
        setShowConfirmDialog(true);
        setIsLocating(false);
        toast.success("Localização atualizada para sua posição GPS!");
      },
      (error) => {
        let errorMessage = "Erro ao obter sua localização.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Permissão de geolocalização negada.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Informações de localização indisponíveis.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Tempo esgotado ao obter a localização.";
        }
        toast.error(errorMessage);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmSave = (finalAddressName: string) => {
    if (dialogAddressDetails) {
      const { index, newLat, newLng } = dialogAddressDetails;
      setAddresses((prevAddresses) => {
        const newAddresses = [...prevAddresses];
        const updatedAddress = {
          ...newAddresses[index],
          latitude: newLat.toFixed(6),
          longitude: newLng.toFixed(6),
          status: "atualizado" as const,
          note: "Ajustado no mapa",
          learned: true,
          correctedAddress: finalAddressName,
        };
        newAddresses[index] = updatedAddress;

        const learningKey = buildLearningKey(updatedAddress);
        saveLearnedLocation(learningKey, newLat, newLng);

        return newAddresses;
      });

      setMarkersData(prev =>
        prev.map(m =>
          m.index === index
            ? { ...m, originalPosition: { lat: newLat, lng: newLng }, color: "#3b82f6" }
            : m
        )
      );

      toast.success("Localização atualizada e salva para aprendizado!");
    }
    setShowConfirmDialog(false);
    setDialogAddressDetails(null);
    setSelectedMarkerIndex(null);
  };

  const handleCancelSave = () => {
    if (dialogAddressDetails) {
      const { index, originalLat, originalLng } = dialogAddressDetails;
      setMarkersData(prev =>
        prev.map(m =>
          m.index === index
            ? { ...m, position: { lat: originalLat, lng: originalLng } }
            : m
        )
      );
      toast.info("Ajuste de localização cancelado.");
    }
    setShowConfirmDialog(false);
    setDialogAddressDetails(null);
    setSelectedMarkerIndex(null);
  };

  const handleFinishAdjustments = () => {
    navigate("/", {
      state: {
        adjustedData: addresses,
        fromAdjustments: true,
        totalOriginalSequences: totalOriginalSequences,
      },
    });
  };

  const getMarkerIcon = (color: string, isSelected: boolean) => {
    const scale = isSelected ? 1.3 : 1;
    return {
      path: google.maps.SymbolPath.DROP,
      fillColor: isSelected ? "#fbbf24" : color,
      fillOpacity: 1,
      strokeColor: isSelected ? "#f59e0b" : "#ffffff",
      strokeWeight: isSelected ? 3 : 2,
      scale: 10 * scale,
    };
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
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 w-full sm:w-auto"
            size="sm"
          >
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
              Clique em um pin para selecioná-lo e arrastar, ou use sua localização GPS.
            </p>
          </div>

          <div className="mb-6 rounded-lg overflow-hidden border-2 border-primary/30">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
              onClick={handleMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {markersData.map((markerData) => (
                <Marker
                  key={markerData.index}
                  position={markerData.position}
                  draggable={selectedMarkerIndex === markerData.index}
                  onClick={() => {
                    handleMarkerClick(markerData.index);
                    handleMarkerInfoClick(markerData.index, markerData.position);
                  }}
                  onDragEnd={(e) => handleMarkerDragEnd(markerData.index, e)}
                  icon={getMarkerIcon(markerData.color, selectedMarkerIndex === markerData.index)}
                  animation={
                    selectedMarkerIndex === markerData.index
                      ? google.maps.Animation.BOUNCE
                      : undefined
                  }
                />
              ))}
              
              {/* InfoWindow para mostrar detalhes do endereço */}
              {infoWindowData && (
                <InfoWindow
                  position={infoWindowData.position}
                  onCloseClick={() => setInfoWindowData(null)}
                >
                  <div className="p-2">
                    <h3 className="font-bold text-base text-gray-800">{infoWindowData.content}</h3>
                    <p className="text-sm text-gray-700 mt-1">Clique e arraste para mover</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleUseMyLocation}
              disabled={selectedMarkerIndex === null || isLocating}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLocating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Localizando...
                </>
              ) : (
                <>
                  <Locate className="h-4 w-4" />
                  Usar Minha Localização
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {dialogAddressDetails && (
        <ConfirmLocationSaveDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirmSave}
          onCancel={handleCancelSave}
          addressName={dialogAddressDetails.addressName}
          newLat={dialogAddressDetails.newLat}
          newLng={dialogAddressDetails.newLng}
        />
      )}
    </div>
  );
}

export default function LocationAdjustments() {
  return (
    <GoogleMapsLoader>
      <LocationAdjustmentsContent />
    </GoogleMapsLoader>
  );
}