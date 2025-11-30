export function normalizeCoordinate(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  
  const stringValue = String(value).trim().replace(",", ".");
  const num = Number(stringValue);
  
  return isNaN(num) ? undefined : num;
}

/**
 * Extrai o complemento de um endereço formatado como "Rua, Número, Complemento".
 * Retorna o complemento ou uma string vazia se não houver.
 * Ex: "Estrada São Tarcísio, 116, veterinaria apaixonados 4 pata" -> "veterinaria apaixonados 4 pata"
 * Ex: "Rua Exemplo, 123" -> ""
 * @param fullAddress A string completa do endereço.
 * @returns O complemento do endereço.
 */
export function extractAddressComplement(fullAddress: string): string {
  const match = fullAddress.match(/^(.*?),\s*(\d+[a-zA-Z]?)\s*(?:,\s*(.*))?$/);
  if (match && match[3]) {
    return match[3].trim();
  }
  return "";
}

/**
 * Normaliza uma string de complemento para um formato canônico,
 * agrupando variações que se referem ao mesmo tipo de local.
 * @param complement O complemento original do endereço.
 * @returns O complemento normalizado.
 */
export function normalizeComplement(complement: string | undefined | null): string {
  if (!complement) return "";
  let normalized = complement.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  // Padrões para "loja de celular"
  if (/(loja|assistencia|manutencao|conserto)\s*(de|para|para\s*|)\s*celular(es)?/.test(normalized)) {
    return "loja de celular";
  }
  // Adicione outros padrões conforme necessário
  // Ex: "farmacia" -> "farmacia"
  if (/(farmacia|drogaria)/.test(normalized)) {
    return "farmacia";
  }
  // Ex: "padaria" -> "padaria"
  if (/(padaria|panificadora)/.test(normalized)) {
    return "padaria";
  }
  // Ex: "restaurante" -> "restaurante"
  if (/(restaurante|lanchonete|bar)/.test(normalized)) {
    return "restaurante";
  }
  // Ex: "escola" -> "escola"
  if (/(escola|colegio|instituto)/.test(normalized)) {
    return "escola";
  }

  // Se não houver padrão, retorna o complemento normalizado original
  return normalized;
}

/**
 * Extrai e normaliza o nome da rua e o número da casa de um endereço para fins de agrupamento e aprendizado.
 * Ignora sufixos como 'a', 'b', 'fundos' no número da casa.
 * Ex: "Estrada São Tarcísio, 116, veterinaria" -> "estrada sao tarcisio 116"
 * Ex: "Rua Exemplo, 123a" -> "rua exemplo 123"
 * Ex: "Av. Brasil S/N" -> "avenida brasil"
 * @param fullAddress A string completa do endereço.
 * @returns Uma string normalizada contendo a rua e o número principal.
 */
export function extractNormalizedStreetAndNumber(fullAddress: string): string {
  if (!fullAddress) return "";

  // Remove complement first to simplify street and number extraction
  // This regex tries to find a pattern like "Street Name, Number, Complement"
  // and takes only "Street Name, Number" part.
  const addressWithoutComplementMatch = fullAddress.match(/^(.*?),\s*(\d+[a-zA-Z]?)(?:,\s*.*)?$/);
  let addressToParse = fullAddress;

  if (addressWithoutComplementMatch) {
    addressToParse = `${addressWithoutComplementMatch[1]}, ${addressWithoutComplementMatch[2]}`;
  }

  // Normalize street part: lowercase, remove accents, common abbreviations
  let normalizedAddress = addressToParse
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .replace(/(av|av\.|avenida)\b/g, "avenida") // Standardize abbreviations
    .replace(/\b(r|r\.)\b/g, "rua")
    .replace(/(rod|rod\.|rodovia)\b/g, "rodovia")
    .replace(/\b(travessa|tv)\b/g, "travessa")
    .replace(/\b(alameda|al)\b/g, "alameda")
    .replace(/\b(praca|pc)\b/g, "praca")
    .replace(/\b(largo|lg)\b/g, "largo")
    .replace(/\b(quadra|q)\b/g, "quadra")
    .replace(/\b(lote|lt)\b/g, "lote")
    .replace(/\b(sn|s\/n)\b/g, "") // Remove S/N (sem numero)
    .replace(/[^\w\s\d\-\,\.]/g, "") // Allow alphanumeric, spaces, hyphens, commas, periods
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();

  let streetName = normalizedAddress;
  let houseNumber = "";

  // Regex to find a street name followed by a number (digits only, ignoring suffixes like 'a', 'b')
  // It looks for:
  // (.*?) - any characters (street name)
  // (?:,\s*|\s+) - non-capturing group for comma+space or just space separator
  // (\d+) - captures the digits of the house number
  // (?:[a-z\s\-\/,\.]*$) - non-capturing group for optional suffix/complement at the end
  const match = normalizedAddress.match(/(.*?)(?:,\s*|\s+)(\d+)(?:[a-z\s\-\/,\.]*)$/);

  if (match) {
    streetName = match[1].trim();
    houseNumber = match[2].trim(); // This will be just the digits, e.g., "116" from "116a"
  } else {
    // Fallback: if no clear number at the end, try to find the first number that could be a house number
    // This is less reliable but better than nothing.
    const firstNumberMatch = normalizedAddress.match(/(.*?)\s*(\d+)/);
    if (firstNumberMatch) {
      streetName = firstNumberMatch[1].trim();
      houseNumber = firstNumberMatch[2].trim();
    }
  }

  // If a house number was found, combine it with the street name.
  // Otherwise, just return the normalized street name.
  if (houseNumber) {
    return `${streetName} ${houseNumber}`.trim();
  } else {
    return streetName;
  }
}