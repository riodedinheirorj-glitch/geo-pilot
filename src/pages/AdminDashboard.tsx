import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  getProfiles, 
  updateUserCredits,
  getPendingPurchases,
  approvePurchase,
  getTransactions
} from "@/lib/supabase-helpers";

// Import new modular components
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import UserManagementTab from "@/components/admin/UserManagementTab";
import PendingPurchasesTab from "@/components/admin/PendingPurchasesTab";
import TransactionHistoryTab from "@/components/admin/TransactionHistoryTab";

interface UserStats {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
  download_count: number;
}

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminId, setAdminId] = useState<string>("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditInputs, setCreditInputs] = useState<{ [key: string]: string }>({});
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Server-side admin verification using RLS-protected query
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !roleData) {
        toast.error("Acesso negado. Você não é um administrador.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setAdminId(user.id);

      // Load user profiles
      const { data: profiles, error: profilesError } = await getProfiles();

      if (profilesError) throw profilesError;

      setTotalUsers(profiles?.length || 0);

      // Fetch all downloads and create a map for counts
      const { data: allDownloads, error: downloadsError } = await supabase
        .from('downloads')
        .select('user_id') as any;

      if (downloadsError) throw downloadsError;

      const downloadCounts = new Map<string, number>();
      allDownloads?.forEach((download: any) => {
        if (download.user_id) {
          downloadCounts.set(download.user_id, (downloadCounts.get(download.user_id) || 0) + 1);
        }
      });

      // Combine profiles with download counts
      const stats = profiles?.map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        credits: profile.credits || 0,
        download_count: downloadCounts.get(profile.id) || 0,
      })) || [];

      setUserStats(stats);

      // Load pending purchases
      const { data: purchases } = await getPendingPurchases();
      
      // Delete pending purchases older than 10 minutes
      if (purchases && purchases.length > 0) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const expiredPurchaseIds = purchases
          .filter(p => new Date(p.created_at) < tenMinutesAgo)
          .map(p => p.id);
        
        if (expiredPurchaseIds.length > 0) {
          await supabase
            .from('credit_purchases')
            .delete()
            .in('id', expiredPurchaseIds);
          
          // Filter out expired purchases from the list
          const activePurchases = purchases.filter(p => !expiredPurchaseIds.includes(p.id));
          setPendingPurchases(activePurchases);
        } else {
          setPendingPurchases(purchases);
        }
      } else {
        setPendingPurchases([]);
      }

      // Load transactions
      const { data: trans } = await getTransactions();
      setTransactions(trans || []);

      // Calculate total revenue from approved purchases
      const { data: approvedPurchases } = await supabase
        .from('credit_purchases')
        .select('amount')
        .eq('status', 'approved') as any;

      if (approvedPurchases && approvedPurchases.length > 0) {
        const grossRevenue = approvedPurchases.reduce((acc: number, p: any) => acc + Number(p.amount), 0);
        const fees = approvedPurchases.length * 0.80; // R$ 0,80 por transação
        const netRevenue = grossRevenue - fees;
        setTotalRevenue(netRevenue);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar dados do dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const handleUpdateCredits = async (userId: string, amount: number) => {
    const result = await updateUserCredits(userId, amount, adminId);
    
    if (result.success) {
      toast.success("Créditos atualizados com sucesso!");
      await checkAdminAndLoadData();
      setCreditInputs({ ...creditInputs, [userId]: "" });
    } else {
      toast.error(result.error || "Erro ao atualizar créditos");
    }
  };

  const handleApprovePurchase = async (purchaseId: string) => {
    const result = await approvePurchase(purchaseId, adminId);
    
    if (result.success) {
      toast.success("Compra aprovada com sucesso!");
      await checkAdminAndLoadData();
    } else {
      toast.error(result.error || "Erro ao aprovar compra");
    }
  };

  const handleRejectPurchase = async (purchaseId: string) => {
    const { error } = await (supabase as any)
      .from("credit_purchases")
      .update({ status: "rejected" })
      .eq("id", purchaseId);
    
    if (!error) {
      toast.success("Compra rejeitada");
      await checkAdminAndLoadData();
    } else {
      toast.error("Erro ao rejeitar compra");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <AdminHeader onLogout={handleLogout} />

        <AdminStatsCards 
          totalUsers={totalUsers} 
          totalDownloads={userStats.reduce((acc, user) => acc + user.download_count, 0)} 
          totalRevenue={totalRevenue} 
        />

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="purchases">
              Pedidos Pendentes
              {pendingPurchases.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                  {pendingPurchases.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagementTab 
              userStats={userStats} 
              creditInputs={creditInputs} 
              setCreditInputs={setCreditInputs} 
              onUpdateCredits={handleUpdateCredits} 
            />
          </TabsContent>

          <TabsContent value="purchases">
            <PendingPurchasesTab 
              pendingPurchases={pendingPurchases} 
              onApprovePurchase={handleApprovePurchase} 
              onRejectPurchase={handleRejectPurchase} 
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistoryTab transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}