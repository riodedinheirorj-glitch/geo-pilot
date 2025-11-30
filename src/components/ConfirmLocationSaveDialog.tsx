import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin } from "lucide-react";

interface ConfirmLocationSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  addressName: string;
  newLat: number;
  newLng: number;
}

export function ConfirmLocationSaveDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  addressName,
  newLat,
  newLng,
}: ConfirmLocationSaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Salvar Nova Localização?
          </DialogTitle>
          <DialogDescription>
            Você moveu o pin para o endereço: <span className="font-semibold">{addressName}</span>.
            Deseja salvar as novas coordenadas?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">Latitude:</span> {newLat.toFixed(6)}
          </p>
          <p>
            <span className="font-medium">Longitude:</span> {newLng.toFixed(6)}
          </p>
          <p className="mt-2">
            Esta localização será salva para uso futuro e marcada como "atualizada".
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Salvar Localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}