import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Coins, Plus, Minus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

interface UserStats {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
  download_count: number;
}

interface UserManagementTabProps {
  userStats: UserStats[];
  creditInputs: { [key: string]: string };
  setCreditInputs: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onUpdateCredits: (userId: string, amount: number) => Promise<void>;
}

// Validation schema
const creditAmountSchema = z.number()
  .int("Valor deve ser um número inteiro")
  .min(-10000, "Valor mínimo: -10000")
  .max(10000, "Valor máximo: 10000")
  .refine((val) => val !== 0, { message: "Valor não pode ser zero" });

export default function UserManagementTab({
  userStats,
  creditInputs,
  setCreditInputs,
  onUpdateCredits,
}: UserManagementTabProps) {
  const handleUpdateCreditsWrapper = async (userId: string, amount: number) => {
    try {
      creditAmountSchema.parse(amount);
      await onUpdateCredits(userId, amount);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error((error as Error).message || "Erro ao atualizar créditos.");
      }
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Gerenciar Usuários</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Nome</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Email</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Créditos</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Downloads</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Ações</th>
            </tr>
          </thead>
          <tbody>
            {userStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-muted-foreground text-sm">
                  Nenhum usuário cadastrado ainda
                </td>
              </tr>
            ) : (
              userStats.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-xs sm:text-sm">{user.full_name || "Não informado"}</td>
                  <td className="p-3 text-xs sm:text-sm">{user.email}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
                      <Coins className="h-3 w-3 mr-1" />
                      {user.credits}
                    </span>
                  </td>
                  <td className="p-3 text-xs sm:text-sm">{user.download_count}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Input
                        type="number"
                        placeholder="Qtd"
                        value={creditInputs[user.id] || ""}
                        onChange={(e) => setCreditInputs({ ...creditInputs, [user.id]: e.target.value })}
                        className="w-16 sm:w-20 text-xs sm:text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => {
                          const amount = parseInt(creditInputs[user.id] || "0");
                          if (amount !== 0) handleUpdateCreditsWrapper(user.id, amount);
                        }}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive hover:bg-destructive/10 h-7 w-7 sm:h-8 sm:w-8 p-0"
                        onClick={() => {
                          const amount = parseInt(creditInputs[user.id] || "0");
                          if (amount !== 0) handleUpdateCreditsWrapper(user.id, -amount);
                        }}
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
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