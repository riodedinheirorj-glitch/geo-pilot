import { useState } from "react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface AdminSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSetupDialog({ open, onOpenChange }: AdminSetupDialogProps) {
  const [setupToken, setSetupToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const handleSetup = async () => {
    if (!setupToken.trim()) {
      toast.error("Por favor, insira o token de setup");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        headers: {
          "X-Setup-Token": setupToken,
        },
      });

      if (error) throw error;

      if (data.success || data.message === "Admin user already exists") {
        setSuccess(true);
        setCredentials(data.credentials);
        toast.success(data.message);
      } else {
        throw new Error(data.error || "Erro ao criar administrador");
      }
    } catch (error: any) {
      console.error("Error setting up admin:", error);
      toast.error(error.message || "Erro ao criar administrador");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSetupToken("");
    setSuccess(false);
    setCredentials(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setup de Administrador</DialogTitle>
          <DialogDescription>
            Configure o primeiro usuário administrador do sistema
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="setup-token">Token de Setup</Label>
              <Input
                id="setup-token"
                type="password"
                placeholder="Insira o token de setup"
                value={setupToken}
                onChange={(e) => setSetupToken(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Este token está definido na variável de ambiente ADMIN_SETUP_TOKEN
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta ação criará um usuário admin com credenciais padrão.
                Certifique-se de alterar a senha após o primeiro login.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                Administrador criado com sucesso!
              </AlertDescription>
            </Alert>

            {credentials && (
              <div className="space-y-3 rounded-md border p-4 bg-muted">
                <h4 className="font-semibold text-sm">Credenciais de Login:</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-mono font-semibold">{credentials.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Senha: </span>
                    <span className="font-mono font-semibold">{credentials.password}</span>
                  </div>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-2">
                  ⚠️ IMPORTANTE: Altere esta senha imediatamente após o primeiro login!
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!success ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSetup} disabled={loading}>
                {loading ? "Criando..." : "Criar Administrador"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
