import { ChevronLeft, Clock, Map, DollarSign, Navigation } from "lucide-react";
import { ImportedData } from "@/pages/Index";

interface OptimizationResultProps {
  onNavigate: (screen: string) => void;
  importedData: ImportedData | null;
}

const OptimizationResult = ({ onNavigate, importedData }: OptimizationResultProps) => {
  // Cálculos simulados baseados na quantidade real de endereços
  const count = importedData?.totalAddresses || 0;
  const timeSaved = count * 2; // 2 min por parada
  const kmSaved = Math.round(count * 0.4); // 400m por parada
  const moneySaved = count * 1.5; // R$ 1,50 por parada

  return (
    <div className="flex flex-col h-full bg-background px-5 pb-8">
      <div className="flex items-center gap-3 py-4 mb-2">
        <button onClick={() => onNavigate("import")} className="w-9 h-9 bg-card rounded-full shadow-card flex items-center justify-center">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
      </div>

      <div className="text-center py-6 mb-6">
        <div className="text-4xl mb-3">🎉</div>
        <h1 className="text-2xl font-extrabold text-foreground leading-tight">Rota otimizada</h1>
        <h2 className="text-2xl font-extrabold text-foreground leading-tight">com sucesso!</h2>
        <p className="text-sm text-muted-foreground mt-2">Calculamos a melhor sequência para {count} paradas</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="bg-card rounded-[20px] shadow-card p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(213 83% 56% / 0.10)" }}>
            <Clock size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground">−{timeSaved} min</p>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">Economizados</p>
          </div>
        </div>

        <div className="bg-card rounded-[20px] shadow-card p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(213 83% 56% / 0.10)" }}>
            <Map size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground">−{kmSaved} km</p>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">Reduzidos</p>
          </div>
        </div>

        <div className="rounded-[20px] p-5 flex items-center gap-4" style={{ background: "hsl(var(--success) / 0.08)", border: "1px solid hsl(var(--success) / 0.2)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--success) / 0.15)" }}>
            <DollarSign size={24} className="text-success" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-success">+R${moneySaved.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">Economia potencial</p>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <button onClick={() => onNavigate("route")} className="w-full gradient-primary text-white font-bold text-base py-4 rounded-[16px] shadow-button flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <Navigation size={18} /> INICIAR NAVEGAÇÃO
        </button>
      </div>
    </div>
  );
};

export default OptimizationResult;