import { Card } from "@/components/ui/card";
import { Users, Download, Coins } from "lucide-react";

interface AdminStatsCardsProps {
  totalUsers: number;
  totalDownloads: number;
  totalRevenue: number;
}

export default function AdminStatsCards({ totalUsers, totalDownloads, totalRevenue }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Usuários</p>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-secondary/10 to-accent/10 border-2 border-secondary/20">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-secondary/20 rounded-lg">
            <Download className="h-8 w-8 text-secondary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Downloads</p>
            <p className="text-3xl font-bold">{totalDownloads}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-accent/20">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-accent/20 rounded-lg">
            <Coins className="h-8 w-8 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Créditos Vendidos</p>
            <p className="text-3xl font-bold text-green-600">
              R$ {totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}