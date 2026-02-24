import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import ActiveRoute from "@/components/ActiveRoute";
import ImportRomaneio from "@/components/ImportRomaneio";
import OptimizationResult from "@/components/OptimizationResult";
import OptimizationLoading from "@/components/OptimizationLoading";
import LocationAdjustment from "@/components/LocationAdjustment";
import Profile from "@/components/Profile";
import Subscription from "@/components/Subscription";
import BottomNav from "@/components/BottomNav";
import StatusBar from "@/components/StatusBar";

export type ImportedData = {
  rows: Record<string, string>[];
  headers: string[];
  totalAddresses: number;
  duplicates: number;
  fixedCeps: number;
};

type Screen = "dashboard" | "route" | "import" | "result" | "loading" | "adjustment" | "profile" | "subscription";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [importedData, setImportedData] = useState<ImportedData | null>(null);

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
      case "subscription":
        return <Subscription onNavigate={navigate} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#E8ECF1] flex items-center justify-center p-6">
      <div className="phone-frame flex flex-col" style={{ maxHeight: "860px" }}>
        <StatusBar />
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