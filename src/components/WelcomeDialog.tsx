import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
  credits: number;
}

export function WelcomeDialog({ open, onClose, credits }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bem-vindo ao RotaSmart! 🎉</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          Você recebeu <strong>{credits} créditos</strong> de boas-vindas para começar a otimizar suas rotas!
        </p>
        <Button onClick={onClose} className="w-full mt-4">Começar</Button>
      </DialogContent>
    </Dialog>
  );
}
