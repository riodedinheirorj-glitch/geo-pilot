import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WelcomeBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credits: number;
  granted?: boolean;
  onClaim?: () => void;
}

export function WelcomeBonusDialog({ open, onOpenChange, credits, granted, onClaim }: WelcomeBonusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🎁 Bônus de Boas-vindas</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          {granted
            ? `Você recebeu ${credits} créditos de bônus!`
            : `Clique abaixo para receber ${credits} créditos grátis!`}
        </p>
        {!granted && (
          <Button onClick={onClaim} className="w-full mt-4">Receber créditos</Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
