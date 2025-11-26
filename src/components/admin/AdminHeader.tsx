import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AdminHeaderProps {
  onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-center sm:text-left">
          Dashboard RotaSmart
        </h1>
        <p className="text-muted-foreground mt-2 text-center sm:text-left">
          Gerencie usuários e visualize estatísticas
        </p>
      </div>
      <Button onClick={onLogout} variant="outline" className="w-full sm:w-auto">
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}