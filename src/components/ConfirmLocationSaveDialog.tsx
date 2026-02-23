import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ConfirmLocationSaveDialogProps {
  open: boolean;
  addressName: string;
  onConfirm: (finalName: string) => void;
  onCancel: () => void;
  onOpenChange?: (open: boolean) => void;
  newLat?: number;
  newLng?: number;
}

export function ConfirmLocationSaveDialog({ open, addressName, onConfirm, onCancel }: ConfirmLocationSaveDialogProps) {
  const [editedName, setEditedName] = useState(addressName);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar localização</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">Confirme ou edite o nome do endereço:</p>
        <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} />
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={() => onConfirm(editedName)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
