import { ProcessedAddress } from "@/lib/nominatim-service";
import { extractNormalizedStreetAndNumber } from "@/lib/coordinate-helpers"; // Import new helper

/**
 * Constrói uma chave única para o aprendizado de localização baseada nos campos do endereço.
 * Prioriza campos mais específicos para a chave.
 * @param row O objeto de endereço processado.
 * @returns Uma string única para a chave de aprendizado.
 */
export function buildLearningKey(row: ProcessedAddress): string {
  // Sempre use o endereço original (ou rawAddress) para construir a chave de aprendizado.
  // Isso garante que a chave seja consistente, independentemente de o endereço ter sido corrigido ou não.
  const fullAddressForLearningKey = (row.originalAddress || row.rawAddress || "").trim();
  const normalizedStreetAndNumber = extractNormalizedStreetAndNumber(fullAddressForLearningKey);
  
  const bairro = (row.bairro || "").trim();
  const cidade = (row.cidade || "").trim();
  const estado = (row.estado || "").trim();

  // Combine normalized street/number with other relevant fields, EXCLUDING complement for coordinate learning
  return `${normalizedStreetAndNumber}_${bairro}_${cidade}_${estado}`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
}

interface LearnedLocation {
  lat: number;
  lng: number;
  updatedAt: number;
}

/**
 * Salva uma coordenada corrigida no localStorage para aprendizado futuro.
 * @param key A chave de aprendizado do endereço.
 * @param lat Latitude corrigida.
 * @param lng Longitude corrigida.
 */
export function saveLearnedLocation(key: string, lat: number, lng: number): void {
  try {
    const data = JSON.parse(localStorage.getItem("rotasmart_learning") || "{}");
    data[key] = { lat, lng, updatedAt: Date.now() };
    localStorage.setItem("rotasmart_learning", JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar localização aprendida no localStorage:", error);
  }
}

/**
 * Carrega uma coordenada aprendida do localStorage.
 * @param key A chave de aprendizado do endereço.
 * @returns As coordenadas aprendidas (lat, lng) ou null se não encontradas.
 */
export function loadLearnedLocation(key: string): LearnedLocation | null {
  try {
    const data = JSON.parse(localStorage.getItem("rotasmart_learning") || "{}");
    return data[key] || null;
  } catch (error) {
    console.error("Erro ao carregar localização aprendida do localStorage:", error);
    return null;
  }
}