import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AdminSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSetupDialog({ open, onOpenChange }: AdminSetupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuração de Administrador</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">Configure o administrador do sistema.</p>
      </DialogContent>
    </Dialog>
  );
}
