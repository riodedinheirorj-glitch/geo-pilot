import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface ConfirmLocationSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (editedAddressName: string) => void;
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
  const [editableAddress, setEditableAddress] = useState(addressName);

  useEffect(() => {
    setEditableAddress(addressName);
  }, [addressName]);

  const handleConfirm = () => {
    onConfirm(editableAddress);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Salvar Nova Localização?
          </DialogTitle>
          <DialogDescription>
            Você moveu o pino. Confirme ou edite o nome do endereço para salvar as novas coordenadas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address-name">Nome do Endereço</Label>
            <Input
              id="address-name"
              value={editableAddress}
              onChange={(e) => setEditableAddress(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Latitude:</span> {newLat.toFixed(6)}
            </p>
            <p>
              <span className="font-medium">Longitude:</span> {newLng.toFixed(6)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Salvar Localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}