import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Coins, Check, X } from "lucide-react";

interface PendingPurchase {
  id: string;
  credits: number;
  amount: number;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

interface PendingPurchasesTabProps {
  pendingPurchases: PendingPurchase[];
  onApprovePurchase: (purchaseId: string) => Promise<void>;
  onRejectPurchase: (purchaseId: string) => Promise<void>;
}

export default function PendingPurchasesTab({
  pendingPurchases,
  onApprovePurchase,
  onRejectPurchase,
}: PendingPurchasesTabProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
        Pedidos de Créditos Pendentes
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Usuário</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Créditos</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Valor</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Data</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pendingPurchases.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-muted-foreground text-sm">
                  Nenhum pedido pendente
                </td>
              </tr>
            ) : (
              pendingPurchases.map((purchase) => (
                <tr key={purchase.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-xs sm:text-sm">
                    <div>
                      <p className="font-medium">{purchase.profiles.full_name || "Não informado"}</p>
                      <p className="text-xs text-muted-foreground">{purchase.profiles.email}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
                      <Coins className="h-3 w-3 mr-1" />
                      {purchase.credits}
                    </span>
                  </td>
                  <td className="p-3 text-xs sm:text-sm">
                    <span className="font-bold text-green-600">
                      R$ {purchase.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 text-xs sm:text-sm">
                    {new Date(purchase.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 hover:bg-green-500/10 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => onApprovePurchase(purchase.id)}
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 hover:bg-red-500/10 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => onRejectPurchase(purchase.id)}
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}