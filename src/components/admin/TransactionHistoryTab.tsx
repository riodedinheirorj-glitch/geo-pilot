import { Card } from "@/components/ui/card";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

interface TransactionHistoryTabProps {
  transactions: Transaction[];
}

export default function TransactionHistoryTab({ transactions }: TransactionHistoryTabProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Histórico de Transações</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Data</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Usuário</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Tipo</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Créditos</th>
              <th className="text-left p-3 font-semibold text-xs sm:text-sm">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-muted-foreground text-sm">
                  Nenhuma transação registrada
                </td>
              </tr>
            ) : (
              transactions.map((trans) => (
                <tr key={trans.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-xs sm:text-sm">
                    {new Date(trans.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-xs sm:text-sm">
                    <div>
                      <p className="font-medium">{trans.profiles.full_name || "Não informado"}</p>
                      <p className="text-xs text-muted-foreground">{trans.profiles.email}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trans.type === 'purchase' ? 'bg-green-100 text-green-700' :
                      trans.type === 'download' ? 'bg-red-100 text-red-700' :
                      trans.type === 'admin_add' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {trans.type === 'purchase' ? 'Compra' :
                       trans.type === 'download' ? 'Download' :
                       trans.type === 'admin_add' ? 'Admin +' :
                       'Admin -'}
                    </span>
                  </td>
                  <td className="p-3 text-xs sm:text-sm">
                    <span className={`font-bold ${trans.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trans.amount > 0 ? '+' : ''}{trans.amount}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {trans.description}
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