/**
 * Valida se um par de latitude e longitude é válido.
 * @param lat Latitude.
 * @param lng Longitude.
 * @returns True se as coordenadas são válidas, false caso contrário.
 */
export function isValidCoordinate(lat: number | undefined | null, lng: number | undefined | null): boolean {
  if (lat === null || lng === null || lat === undefined || lng === undefined) return false;
  if (isNaN(lat) || isNaN(lng)) return false;

  // Faixa mundial válida
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;

  // Se for 0,0 geralmente é erro da planilha ou valor padrão inválido
  if (lat === 0 && lng === 0) return false;

  return true;
}