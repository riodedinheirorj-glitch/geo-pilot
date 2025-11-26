import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, Shield, Coins, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/StepIndicator";
import UploadStep from "@/components/UploadStep";
import ProcessingStep from "@/components/ProcessingStep";
import ResultsStep from "@/components/ResultsStep";
import BuyCreditsDialog from "@/components/BuyCreditsDialog";
import CreditsDisplay from "@/components/CreditsDisplay";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { getUserRole, processDownloadRpc, getUserCredits } from "@/lib/supabase-helpers"; // Updated import
import { batchGeocodeAddresses, ProcessedAddress } from "@/lib/nominatim-service"; // Import new service
import { normalizeCoordinate, extractAddressComplement, extractNormalizedStreetAndNumber, normalizeComplement } from "@/lib/coordinate-helpers"; // Import new helper
import { buildLearningKey, loadLearnedLocation } from "@/lib/location-learning"; // Import new learning helpers
import { isValidCoordinate } from "@/lib/validate-coordinates"; // Import new validation helper

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to access location state
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Aguardando início...");
  const [processedData, setProcessedData] = useState<ProcessedAddress[]>([]); // Use new interface
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [totalSequencesCount, setTotalSequencesCount] = useState(0); // State for total sequences

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        // Redirect to auth if not logged in
        navigate("/auth");
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        navigate("/auth");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Handle data coming back from LocationAdjustments page
  useEffect(() => {
    if (location.state?.adjustedData && location.state?.fromAdjustments) {
      setProcessedData(location.state.adjustedData);
      // Use the passed totalOriginalSequences directly
      setTotalSequencesCount(location.state.totalOriginalSequences); 
      setCurrentStep(3); // Move to results step
      // Clear state to prevent re-triggering on subsequent visits
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const checkAdminStatus = async (userId: string) => {
    const data = await getUserRole(userId);
    setIsAdmin(!!data);

    // Load credits
    const userCredits = await getUserCredits(userId);
    setCredits(userCredits);
  };

  // Listen to real-time credit updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Credits updated:', payload);
          const newCredits = (payload.new as any)?.credits || 0;
          
          // Use functional update to compare with previous state
          setCredits(prevCredits => {
            if (newCredits > prevCredits) {
              toast.success(`+${newCredits - prevCredits} créditos adicionados!`, {
                description: `Novo saldo: ${newCredits} créditos`
              });
            }
            return newCredits;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da sua conta");
    navigate("/auth");
  };

  const processFile = async (file: File) => {
    setCurrentStep(2);
    setIsProcessing(true);
    setProgress(10);
    setStatus("Lendo arquivo...");
    try {
      const data = await file.arrayBuffer();
      setProgress(20);
      setStatus("Analisando dados...");
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
      console.log("Total de linhas na planilha:", jsonData.length);
      if (!jsonData || jsonData.length === 0) {
        throw new Error("Planilha vazia ou sem dados válidos");
      }
      
      // Find address column
      const addressColumn = Object.keys(jsonData[0] || {}).find(key => key.toLowerCase().includes('endereco') || key.toLowerCase().includes('endereço') || key.toLowerCase().includes('address') || key.toLowerCase().includes('rua'));
      if (!addressColumn) {
        throw new Error("Coluna de endereço não encontrada na planilha");
      }

      // Find latitude and longitude columns if they exist
      const latColumn = Object.keys(jsonData[0] || {}).find(key => key.toLowerCase().includes('latitude') || key.toLowerCase().includes('lat'));
      const lonColumn = Object.keys(jsonData[0] || {}).find(key => key.toLowerCase().includes('longitude') || key.toLowerCase().includes('lon'));

      // Find bairro, cidade, estado columns dynamically
      const bairroColumn = Object.keys(jsonData[0] || {}).find(key => key.toLowerCase().includes('bairro') || key.toLowerCase().includes('neighborhood'));
      const cidadeColumn = Object.keys(jsonData[0] || {}).find(key => key.toLowerCase().includes('cidade') || key.toLowerCase().includes('city'));
      const estadoColumn = Object.keys(jsonData[0] || {}).find(key => key.toLowerCase().includes('estado') || key.toLowerCase().includes('state'));

      // Find sequence column
      const sequenceColumn = Object.keys(jsonData[0] || {}).find(key => key.toLowerCase().includes('sequence') || key.toLowerCase().includes('sequencia'));
      
      // Calculate total sequences (packages) from the original data
      let calculatedTotalSequences = 0;
      if (sequenceColumn) {
        jsonData.forEach(row => {
          const sequences = String(row[sequenceColumn] || '').trim();
          if (sequences) {
            calculatedTotalSequences += sequences.split('; ').length;
          }
        });
      } else {
        // If no sequence column, assume each row is one package
        calculatedTotalSequences = jsonData.length;
      }

      // --- Pre-processamento: Normalização e Aprendizado Automático ---
      const preProcessedData = jsonData.map(row => {
        const rawAddress = String(row[addressColumn] || '').trim();
        const bairro = bairroColumn ? String(row[bairroColumn] || '').trim() : '';
        const cidade = cidadeColumn ? String(row[cidadeColumn] || '').trim() : '';
        const estado = estadoColumn ? String(row[estadoColumn] || '').trim() : '';
        const complement = extractAddressComplement(rawAddress); // Extract complement
        const normalizedComplement = normalizeComplement(complement); // Normalize complement

        let latFromSheet = latColumn ? normalizeCoordinate(row[latColumn]) : undefined;
        let lonFromSheet = lonColumn ? normalizeCoordinate(row[lonColumn]) : undefined;

        let finalLat: number | undefined = undefined;
        let finalLon: number | undefined = undefined;
        let learned = false;

        // 1. Tenta carregar do aprendizado automático
        const learningKey = buildLearningKey({
          ...row,
          originalAddress: rawAddress,
          bairro,
          cidade,
          estado,
          // complement: normalizedComplement, // Removed from learning key as per previous turn
        } as ProcessedAddress);

        const learnedLocation = loadLearnedLocation(learningKey);

        if (learnedLocation && isValidCoordinate(learnedLocation.lat, learnedLocation.lng)) {
          finalLat = learnedLocation.lat;
          finalLon = learnedLocation.lng;
          learned = true;
        } else if (isValidCoordinate(latFromSheet, lonFromSheet)) {
          // 2. Se não houver aprendizado, usa as coordenadas da planilha se forem válidas
          finalLat = latFromSheet;
          finalLon = lonFromSheet;
        }

        return {
          ...row,
          rawAddress,
          bairro,
          cidade,
          estado,
          complement, // Keep original complement for display
          normalizedComplement, // Store normalized complement for grouping
          latitude: finalLat?.toFixed(6),
          longitude: finalLon?.toFixed(6),
          learned,
        };
      });

      // --- Geocoding and Correction Step (Batch Processing) ---
      setProgress(30);
      setStatus(`Iniciando validação e correção de ${preProcessedData.length} endereços em lotes...`);
      
      const BATCH_SIZE = 50; // Process 50 addresses at a time
      const allGeocodedData: ProcessedAddress[] = [];
      const totalAddresses = preProcessedData.length;

      for (let i = 0; i < totalAddresses; i += BATCH_SIZE) {
        const batch = preProcessedData.slice(i, i + BATCH_SIZE).map(row => ({
          ...row,
          // Garante que latitude e longitude são passadas como string para a Edge Function
          latitude: row.latitude ? String(row.latitude) : undefined,
          longitude: row.longitude ? String(row.longitude) : undefined,
        }));

        setStatus(`Processando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(totalAddresses / BATCH_SIZE)} (${i + 1}-${Math.min(i + BATCH_SIZE, totalAddresses)})...`);
        
        const batchResults = await batchGeocodeAddresses(batch);
        allGeocodedData.push(...batchResults);

        // Update progress (30% to 70% for geocoding)
        const geocodeProgress = Math.floor(((i + BATCH_SIZE) / totalAddresses) * 40);
        setProgress(30 + geocodeProgress);
      }

      setStatus("Agrupando por endereço e complemento...");

      // NEW: Primary grouping by normalized street and number
      const primaryGrouped: { [key: string]: ProcessedAddress[] } = {};
      allGeocodedData.forEach((row: ProcessedAddress) => {
        const addressToGroup = row.correctedAddress || row.originalAddress;
        const primaryGroupKey = extractNormalizedStreetAndNumber(addressToGroup);

        if (!primaryGroupKey) {
          console.warn("Skipping row due to empty primary group key:", row);
          return;
        }

        if (!primaryGrouped[primaryGroupKey]) {
          primaryGrouped[primaryGroupKey] = [];
        }
        primaryGrouped[primaryGroupKey].push(row);
      });

      const finalGroupedResults: ProcessedAddress[] = [];

      Object.values(primaryGrouped).forEach(primaryGroupRows => {
        const firstRow = primaryGroupRows[0]; // Use the first row as a base for other fields
        let consolidatedStatus: ProcessedAddress['status'] = 'valid';
        let consolidatedLatitude = firstRow.latitude;
        let consolidatedLongitude = firstRow.longitude;
        
        const allSequences: string[] = [];
        let hasPending = false;
        let hasCorrected = false;
        let hasLearned = false;

        let allComplementsAreConsistent = true;
        let firstNormalizedComplement: string | null = null;
        let finalConsolidatedComplement = "";

        primaryGroupRows.forEach(row => {
          if (row.status === 'pending') hasPending = true;
          if (row.status === 'corrected') hasCorrected = true;
          if (row.learned) hasLearned = true;

          // Aggregate sequences
          if (sequenceColumn && row[sequenceColumn]) {
            const sequences = String(row[sequenceColumn]).split('; ').map(s => s.trim()).filter(Boolean);
            allSequences.push(...sequences);
          } else if (!sequenceColumn) {
            allSequences.push(String(primaryGroupRows.indexOf(row) + 1));
          }

          // Prioritize manually corrected coordinates if available
          if (row.status === 'corrected' && row.latitude && row.longitude) {
            consolidatedLatitude = row.latitude;
            consolidatedLongitude = row.longitude;
          }

          // Complement Consistency Check
          if (row.normalizedComplement && row.normalizedComplement !== "") {
            if (firstNormalizedComplement === null) {
              firstNormalizedComplement = row.normalizedComplement;
            } else if (row.normalizedComplement !== firstNormalizedComplement) {
              allComplementsAreConsistent = false;
            }
          } else { // If any row has an empty normalizedComplement
            allComplementsAreConsistent = false;
          }
        });

        // Determine final status for the grouped entry
        if (hasPending) {
          consolidatedStatus = 'pending';
        } else if (hasCorrected) {
          consolidatedStatus = 'corrected';
        } else {
          consolidatedStatus = 'valid';
        }

        // Determine final consolidated complement
        if (allComplementsAreConsistent && firstNormalizedComplement !== null) {
          finalConsolidatedComplement = firstNormalizedComplement;
        } else {
          finalConsolidatedComplement = ""; // If not all consistent, or all empty, then no complement
        }

        // Remove duplicates and join sequences
        const uniqueSequences = Array.from(new Set(allSequences)).join(';');

        // Determine the correctedAddress for the grouped item
        // This should be the street and number part of the first row's correctedAddress
        const baseAddressPart = firstRow.correctedAddress?.split(',').slice(0, 2).join(',').trim() ||
                                firstRow.originalAddress?.split(',').slice(0, 2).join(',').trim() ||
                                extractNormalizedStreetAndNumber(firstRow.correctedAddress || firstRow.originalAddress); // Fallback to normalized key if all else fails

        finalGroupedResults.push({
          ...firstRow, // Keep other original fields from the first row
          correctedAddress: baseAddressPart, // Use the base address part
          complement: finalConsolidatedComplement, // Use the determined consolidated complement
          latitude: consolidatedLatitude,
          longitude: consolidatedLongitude,
          status: consolidatedStatus,
          learned: hasLearned,
          [sequenceColumn || 'sequence']: uniqueSequences, // Use the actual sequence column name or 'sequence'
        });
      });

      console.log("Total de linhas originais:", jsonData.length);
      console.log("Total de endereços únicos (agrupados por rua, número e complemento normalizado):", finalGroupedResults.length);
      setProgress(90);
      setStatus("Finalizando...");
      
      setProcessedData(finalGroupedResults);
      setTotalSequencesCount(calculatedTotalSequences);
      setProgress(100);
      setIsProcessing(false);

      console.log("Dados processados antes da navegação:", finalGroupedResults);
      navigate("/adjust-locations", { state: { initialProcessedData: finalGroupedResults, totalOriginalSequences: calculatedTotalSequences } });
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error(error instanceof Error ? error.message : "Verifique o formato e tente novamente.");
      setCurrentStep(1);
      setIsProcessing(false);
    }
  };
  const handleReset = () => {
    setCurrentStep(1);
    setProgress(0);
    setStatus("Aguardando início...");
    setProcessedData([]);
    setIsProcessing(false);
    setTotalSequencesCount(0);
  };
  const handleExport = async (format: 'xlsx' | 'csv') => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const fileName = `RotaSmart-${day}-${month}-${year}.${format}`; // Include format in filename for RPC

    // Deduct credit using RPC
    const result = await processDownloadRpc(user.id, fileName);
    if (!result.success) {
      toast.error(result.error || "Erro ao descontar crédito ou processar download.");
      if (result.error?.includes('Créditos insuficientes')) {
        setShowBuyCredits(true);
      }
      return;
    }

    // Exporta com os mesmos campos originais
    const exportData = processedData;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agrupados por Endereço");
    
    if (format === 'xlsx') {
      XLSX.writeFile(wb, `${fileName}`);
    } else {
      XLSX.writeFile(wb, `${fileName}`);
    }
    toast.success(`Arquivo exportado! Seu arquivo ${format.toUpperCase()} foi baixado com sucesso.`);
  };

  const handleAdjustLocations = () => {
    if (credits === 0) {
      toast.error("Compre mais créditos para ajustar localizações no mapa.", {
        description: "Créditos insuficientes",
      });
      setShowBuyCredits(true);
      return;
    }
    navigate("/adjust-locations", { state: { initialProcessedData: processedData, totalOriginalSequences: totalSequencesCount } });
  };

  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{
        animationDelay: '2s'
      }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* User Menu */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
          {user ? (
            <>
              <CreditsDisplay credits={credits} />
              <Button variant="outline" size="sm" onClick={() => setShowBuyCredits(true)} className="hidden sm:flex border-primary/50 hover:bg-primary/10">
                <Coins className="mr-2 h-4 w-4" />
                Comprar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBuyCredits(true)} className="sm:hidden border-primary/50 hover:bg-primary/10">
                <Coins className="mr-1.5 h-4 w-4" />
                Comprar
              </Button>
              {isAdmin && <Button variant="secondary" size="sm" onClick={() => navigate("/admin")} className="hidden sm:flex">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin
                </Button>}
              {isAdmin && <Button variant="secondary" size="sm" onClick={() => navigate("/admin")} className="sm:hidden">
                  <Shield className="h-4 w-4" />
                </Button>}
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="sm:hidden">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" onClick={() => navigate("/auth")} className="hidden sm:flex">
                <User className="mr-2 h-4 w-4" />
                Entrar
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate("/auth")} className="sm:hidden">
                <User className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <BuyCreditsDialog open={showBuyCredits} onOpenChange={setShowBuyCredits} userId={user?.id || ""} />

        <header className="text-center mb-8 sm:mb-12 px-4 py-6 sm:py-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 animate-float">
            <img src="/rotasmart-logo.png" alt="RotaSmart Logo" className="h-[120px] sm:h-[160px] w-auto" />
          </div>
          {currentStep !== 3 && (
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Gerencie suas rotas de entrega com eficiência. Otimize endereços, agrupe pedidos e exporte dados organizados.
            </p>
          )}
        </header>

        <StepIndicator currentStep={currentStep} />

        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && user && <UploadStep onFileUpload={processFile} isAuthenticated={!!user} onAuthRequired={() => {
          toast.error("Autenticação necessária - Faça login para processar arquivos");
          navigate("/auth");
        }} />}
          
          {currentStep === 2 && <ProcessingStep progress={progress} status={status} isComplete={!isProcessing && progress === 100} />}
          
          {currentStep === 3 && <ResultsStep data={processedData} onExport={handleExport} onReset={handleReset} totalSequences={totalSequencesCount} onAdjustLocations={handleAdjustLocations} />}
        </div>
      </div>

      {/* WhatsApp Support Button */}
      <a
        href="https://wa.me/5521977074612"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute right-full mr-3 bg-card text-foreground px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
          Precisa de ajuda? Fale conosco!
        </span>
      </a>
    </div>;
};
export default Index;