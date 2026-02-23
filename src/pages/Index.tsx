import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/components/Dashboard";
import ActiveRoute from "@/components/ActiveRoute";
import ImportRomaneio from "@/components/ImportRomaneio";
import OptimizationResult from "@/components/OptimizationResult";
import OptimizationLoading from "@/components/OptimizationLoading";
import LocationAdjustment from "@/components/LocationAdjustment";
import Profile from "@/components/Profile";
import Preferences from "@/components/Preferences";
import PersonalData from "@/components/PersonalData";
import Security from "@/components/Security";
import Subscription from "@/components/Subscription";
import Notifications from "@/components/Notifications";
import BottomNav from "@/components/BottomNav";
import StatusBar from "@/components/StatusBar";

export type ImportedData = {
  rows: Record<string, string>[];
  headers: string[];
  totalAddresses: number;
  duplicates: number;
  fixedCeps: number;
};

type Screen = "dashboard" | "route" | "import" | "result" | "loading" | "adjustment" | "profile" | "personal-data" | "security" | "subscription" | "notifications" | "preferences";

const Index = () => {
  const navigateTo = useNavigate();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigateTo("/auth", { replace: true });
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigateTo("/auth", { replace: true });
      else setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, [navigateTo]);

  if (!authChecked) return null;

  const navigate = (s: string) => setScreen(s as Screen);

  const handleDataImported = (data: ImportedData) => {
    setImportedData(data);
    setScreen("loading");
  };

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return <Dashboard onNavigate={navigate} />;
      case "route":
        return <ActiveRoute onNavigate={navigate} importedData={importedData} />;
      case "import":
        return <ImportRomaneio onNavigate={navigate} onDataImported={handleDataImported} />;
      case "loading":
        return <OptimizationLoading onComplete={() => setScreen("adjustment")} importedData={importedData} />;
      case "adjustment":
        return (
          <LocationAdjustment 
            onNavigate={navigate} 
            importedData={importedData} 
            onUpdateData={setImportedData} 
          />
        );
      case "result":
        return <OptimizationResult onNavigate={navigate} importedData={importedData} />;
      case "profile":
        return <Profile onNavigate={navigate} />;
      case "personal-data":
        return <PersonalData onNavigate={navigate} />;
      case "security":
        return <Security onNavigate={navigate} />;
      case "subscription":
        return <Subscription onNavigate={navigate} />;
      case "notifications":
        return <Notifications onNavigate={navigate} />;
      case "preferences":
        return <Preferences onNavigate={navigate} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background md:bg-[#E8ECF1] flex items-center justify-center md:p-6">
      <div className="w-full h-screen md:h-auto md:phone-frame flex flex-col md:max-h-[860px]">
        <div className="hidden md:block">
          <StatusBar />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto h-0" style={{ scrollbarWidth: "none" }}>
            {renderScreen()}
          </div>
        </div>
        {screen !== "loading" && screen !== "adjustment" && <BottomNav current={screen} onNavigate={navigate} />}
      </div>
    </div>
  );
};

export default Index;