import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Upload, FileText, RefreshCw, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { ImportedData } from "@/pages/Index";

interface ImportRomaneioProps {
  onNavigate: (screen: string) => void;
  onDataImported: (data: ImportedData) => void;
}

const ImportRomaneio = ({ onNavigate, onDataImported }: ImportRomaneioProps) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = (file: File) => {
    setLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setError("A planilha está vazia ou não possui dados reconhecíveis.");
          setLoading(false);
          return;
        }

        const headers = Object.keys(rows[0]);
        
        const addresses = rows.map((r) => String(r["Destination Address"] || "").trim().toLowerCase());
        const seen = new Set<string>();
        let duplicates = 0;
        addresses.forEach((addr) => {
          if (seen.has(addr)) duplicates++;
          else seen.add(addr);
        });

        const finalData: ImportedData = {
          totalAddresses: rows.length,
          duplicates,
          fixedCeps: 0,
          rows,
          headers,
        };

        // Dispara automaticamente a otimização
        onDataImported(finalData);
      } catch {
        setError("Não foi possível ler o arquivo. Verifique se é um Excel ou CSV válido.");
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  return (
    <div className="flex flex-col h-full bg-background px-5 pb-8">
      <div className="flex items-center gap-3 py-4 mb-4">
        <button onClick={() => onNavigate("dashboard")} className="w-9 h-9 bg-card rounded-full shadow-card flex items-center justify-center">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Importar Romaneio</h1>
      </div>

      <div
        className={`rounded-[20px] border-2 border-dashed transition-all duration-200 p-8 mb-6 flex flex-col items-center justify-center gap-4 cursor-pointer ${dragging ? "border-primary bg-primary/5" : "bg-card shadow-card"}`}
        style={{ borderColor: dragging ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.25)", minHeight: "240px" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) parseFile(file); }}
        onClick={() => !loading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
          {loading ? <RefreshCw size={32} className="text-primary animate-spin" /> : <Upload size={32} className="text-primary" />}
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-foreground mb-1">
            {loading ? "Processando dados..." : "Arraste o romaneio aqui"}
          </p>
          {!loading && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-primary justify-center">
              <FileText size={14} /> ou clique para selecionar
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-destructive/10 rounded-2xl p-4 mb-4 animate-fade-in">
          <AlertCircle size={18} className="text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      <div className="mt-auto">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Dica:</span> Certifique-se que sua planilha contém as colunas de endereço e coordenadas para uma otimização precisa.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImportRomaneio;