import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PWAProvider } from "@/contexts/PWAContext";
import { UpdateNotification } from "@/components/UpdateNotification";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { InstallPromptDialog } from "@/components/InstallPromptDialog";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import LocationAdjustments from "./pages/LocationAdjustments";

const queryClient = new QueryClient();

function AuthEventBridge() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("App auth event:", event);
      
      if (event === "SIGNED_IN") {
        // Verificar se é admin
        // Esta verificação será feita na página Index também
      } else if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (event === "PASSWORD_RECOVERY") {
        navigate("/auth");
      }
    });

    return () => subscription?.unsubscribe();
  }, [navigate]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PWAProvider>
      <TooltipProvider>
        <Sonner />
        <UpdateNotification />
        <OfflineIndicator />
        <InstallPromptDialog />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthEventBridge />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/adjust-locations" element={<LocationAdjustments />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </PWAProvider>
  </QueryClientProvider>
);

export default App;