import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { ProcessedAddress } from "@/lib/nominatim-service";
import { toast } from "sonner";
import { buildLearningKey, saveLearnedLocation } from "@/lib/location-learning";
import maplibregl from 'maplibre-gl';
import { ConfirmLocationSaveDialog } from "@/components/ConfirmLocationSaveDialog";

interface LocationAdjustmentsState {
  initialProcessedData: ProcessedAddress[];
  totalOriginalSequences: number;
}

export default function LocationAdjustments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initialProcessedData, totalOriginalSequences } = (location.state || {}) as LocationAdjustmentsState;

  const [addresses, setAddresses] = useState<ProcessedAddress[]>(initialProcessedData || []);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ marker: maplibregl.Marker; index: number }[]>([]);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogAddressDetails, setDialogAddressDetails] = useState<{
    index: number;
    addressName: string;
    newLat: number;
    newLng: number;
    originalLat: number;
    originalLng: number;
  } | null>(null);

  const draggingMarkerOriginalCoords = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!initialProcessedData || initialProcessedData.length === 0) {
      toast.error("Nenhum dado de endereço para ajustar. Por favor, faça o upload de uma planilha.");
      navigate("/");
    }
  }, [initialProcessedData, navigate]);

  const handleMarkerClick = (clickedIndex: number) => {
    setSelectedMarkerIndex(prevIndex => {
      const markerData = markers.current.find(m => m.index === clickedIndex);
      if (!markerData) return prevIndex;
      const { marker } = markerData;

      if (prevIndex !== null && prevIndex !== clickedIndex) {
        toast.info("Finalize ou cancele a seleção do pino atual antes de selecionar outro.");
        return prevIndex;
      }

      if (prevIndex === clickedIndex) {
        marker.setDraggable(false);
        marker.getPopup()?.remove();
        toast.info("Seleção de endereço cancelada.");
        return null;
      }

      if (prevIndex === null) {
        marker.setDraggable(true);
        marker.getPopup()?.addTo(map.current!);
        toast.info(`Endereço selecionado: ${addresses[clickedIndex].correctedAddress || addresses[clickedIndex].originalAddress}. Agora você pode arrastar.`);
        return clickedIndex;
      }

      return prevIndex;
    });
  };

  const handleMapClick = () => {
    setSelectedMarkerIndex(prevIndex => {
      if (prevIndex !== null) {
        const prevMarker = markers.current.find(m => m.index === prevIndex)?.marker;
        if (prevMarker) {
          prevMarker.setDraggable(false);
          prevMarker.getPopup()?.remove();
        }
        toast.info("Seleção de endereço cancelada.");
        return null;
      }
      return prevIndex;
    });
  };

  useEffect(() => {
    if (!mapContainer.current || addresses.length === 0) return;
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
      center: [-46.633309, -23.55052],
      zoom: 13
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    const bounds = new maplibregl.LngLatBounds();
    
    addresses.forEach((address, index) => {
      const lat = parseFloat(address.latitude || '-23.55052');
      const lng = parseFloat(address.longitude || '-46.633309');

      if (isNaN(lat) || isNaN(lng)) return;

      const markerColor = 
        address.status === 'valid' ? '#10b981' :
        address.status === 'corrected' || address.status === 'atualizado' ? '#3b82f6' :
        '#ef4444';

      const marker = new maplibregl.Marker({
        color: markerColor,
        draggable: false
      })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ anchor: 'bottom' }).setHTML(`
          <div class="p-2 bg-white rounded-md shadow-md">
            <p class="font-semibold text-base text-black">${address.correctedAddress || address.originalAddress}</p>
            <p class="text-sm text-gray-800 mt-1">Clique para selecionar e arrastar</p>
          </div>
        `))
        .addTo(map.current!);

      marker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        handleMarkerClick(index);
      });

      marker.on('dragstart', () => {
        const currentLngLat = marker.getLngLat();
        draggingMarkerOriginalCoords.current = { lat: currentLngLat.lat, lng: currentLngLat.lng };
      });

      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        const originalCoords = draggingMarkerOriginalCoords.current;

        if (originalCoords) {
          setDialogAddressDetails({
            index,
            addressName: address.correctedAddress || address.originalAddress,
            newLat: newLngLat.lat,
            newLng: newLngLat.lng,
            originalLat: originalCoords.lat,
            originalLng: originalCoords.lng,
          });
          setShowConfirmDialog(true);
        }
        draggingMarkerOriginalCoords.current = null;
      });

      markers.current.push({ marker, index });
      bounds.extend([lng, lat]);
    });

    if (markers.current.length > 0) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }

    map.current.on('click', handleMapClick);

    return () => {
      markers.current.forEach(({ marker }) => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [addresses.length]);

  const handleConfirmSave = () => {
    if (dialogAddressDetails) {
      const { index, newLat, newLng } = dialogAddressDetails;
      setAddresses((prevAddresses) => {
        const newAddresses = [...prevAddresses];
        const updatedAddress = {
          ...newAddresses[index],
          latitude: newLat.toFixed(6),
          longitude: newLng.toFixed(6),
          status: 'atualizado' as const,
          note: 'Ajustado no mapa',
          learned: true,
        };
        newAddresses[index] = updatedAddress;

        const learningKey = buildLearningKey(updatedAddress);
        saveLearnedLocation(learningKey, newLat, newLng);

        return newAddresses;
      });
      toast.success("Localização atualizada e salva para aprendizado!");
    }
    setShowConfirmDialog(false);
    setDialogAddressDetails(null);
    setSelectedMarkerIndex(null);
  };

  const handleCancelSave = () => {
    if (dialogAddressDetails) {
      const { index, originalLat, originalLng } = dialogAddressDetails;
      const markerToRevert = markers.current.find(m => m.index === index)?.marker;
      if (markerToRevert) {
        markerToRevert.setLngLat([originalLng, originalLat]);
      }
      toast.info("Ajuste de localização cancelado.");
    }
    setShowConfirmDialog(false);
    setDialogAddressDetails(null);
    setSelectedMarkerIndex(null);
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
              Clique em um pin para selecioná-lo e arrastar.
            </p>
          </div>

          <div className="mb-6 rounded-lg overflow-hidden border-2 border-primary/30">
            <div ref={mapContainer} className="h-[400px] w-full" />
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