import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { toast } from "sonner";

export const NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/search";
export const RATE_LIMIT_DELAY = 1100; // 1.1 seconds to respect 1 request per second limit
const DEFAULT_COUNTRY_CODE = "br"; // ajuste se necessário

// Helpers (kept for potential future client-side use or reference, though not directly used by batchGeocodeAddresses)
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

function normalizeText(s: string | undefined | null): string {
  if (!s) return "";
  // lowercase, trim, remove diacritics, collapse spaces
  const withNoAccents = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return withNoAccents.toLowerCase()
    .replace(/(av|av\.|avenida)\b/g, "avenida")
    .replace(/\b(r|r\.)\b/g, "rua")
    .replace(/(rod|rod\.|rodovia)\b/g, "rodovia")
    .replace(/\b(proximo a|proximo|próximo a|perto de|em frente ao|ao lado de)\b/g, "")
    .replace(/[^\w\s\-\,]/g, "") // remove chars estranhos
    .replace(/\s+/g, " ")
    .trim();
}

interface InputAddressRow {
  rawAddress?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: string; // Adicionado para passar coordenadas da planilha
  longitude?: string; // Adicionado para passar coordenadas da planilha
  learned?: boolean; // NEW: Adicionado para indicar se a localização foi aprendida
  [key: string]: any; // Allow other original fields
}

// These functions are now primarily used by the Edge Function, but their types are useful.
interface NominatimAddressDetails {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  suburb?: string;
  neighbourhood?: string;
  state?: string;
  [key: string]: any;
}

interface ExpectedAddressDetails {
  bairro?: string;
  cidade?: string;
  estado?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddressDetails;
  [key: string]: any;
}

export interface ProcessedAddress {
  originalAddress: string;
  correctedAddress?: string;
  latitude?: string;
  longitude?: string;
  status: 'valid' | 'corrected' | 'pending' | 'mismatch' | 'corrected-by-geocode' | 'atualizado'; // Adicionado 'atualizado'
  searchUsed?: string;
  note?: string;
  display_name?: string;
  learned?: boolean; // Adicionado para indicar se a localização foi aprendida
  complement?: string; // NEW: Add complement field
  normalizedComplement?: string; // NEW: Add normalized complement for grouping
  [key: string]: any; // Allow other original fields
}

export interface SingleGeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: any;
}

/**
 * Invokes the Supabase Edge Function to geocode a batch of addresses.
 * @param addresses An array of address objects to geocode.
 * @returns A promise that resolves to an array of ProcessedAddress.
 */
export async function batchGeocodeAddresses(addresses: InputAddressRow[]): Promise<ProcessedAddress[]> {
  try {
    const { data, error } = await supabase.functions.invoke('batch-geocode', {
      body: { addresses }
    });

    if (error) {
      console.error("Edge Function 'batch-geocode' error:", error);
      throw new Error(error.message || "Erro ao geocodificar lote de endereços.");
    }

    if (!Array.isArray(data)) {
      throw new Error("Resposta inválida da Edge Function.");
    }

    return data as ProcessedAddress[];
  } catch (error) {
    console.error("Error calling batch-geocode Edge Function:", error);
    toast.error((error as Error).message || "Erro desconhecido ao processar endereços.");
    return addresses.map(addr => ({
      ...addr,
      originalAddress: addr.rawAddress || '',
      correctedAddress: addr.rawAddress,
      latitude: undefined,
      longitude: undefined,
      status: 'pending',
      note: 'Erro na geocodificação em lote'
    }));
  }
}

/**
 * Invokes the Supabase Edge Function to geocode a single address query.
 * @param query The address string or ZIP code to geocode.
 * @returns A promise that resolves to a SingleGeocodeResult or null if not found.
 */
export async function geocodeSingleAddress(query: string): Promise<SingleGeocodeResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('single-geocode', {
      body: { query }
    });

    if (error) {
      console.error("Edge Function 'single-geocode' error:", error);
      throw new Error(error.message || "Erro ao geocodificar endereço.");
    }

    if (!data || data.message === "No results found for the query.") {
      return null;
    }

    return data as SingleGeocodeResult;
  } catch (error) {
    console.error("Error calling single-geocode Edge Function:", error);
    toast.error((error as Error).message || "Erro desconhecido ao buscar endereço.");
    return null;
  }
}