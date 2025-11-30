import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const LOCATIONIQ_API_URL = "https://us1.locationiq.com/v1/search.php";
const LOCATIONIQ_REVERSE_URL = "https://us1.locationiq.com/v1/reverse.php";
const NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const RATE_LIMIT_DELAY = 1000; // 1 second for Nominatim rate limit
const DEFAULT_COUNTRY_CODE = "Brazil";
const DISTANCE_THRESHOLD_METERS = 100; // Increased threshold for better flexibility
const HIGH_CONFIDENCE_THRESHOLD = 0.8; // 80% confidence score

// Helpers
function sleep(ms: number) {
  return new Promise((r)=>setTimeout(r, ms));
}

function normalizeText(s: string) {
  if (!s) return "";
  return s.normalize("NFD")
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
}

// New helper function to detect "quadra e lote" patterns
function isQuadraLote(address: string): boolean {
  if (!address) return false;
  const normalizedAddress = normalizeText(address);
  // Regex para detectar padrões como "q 12 lt 34", "quadra 12 lote 34", "qd 12 l 34"
  // ou "q. 12 l. 34", "q-12 l-34"
  const quadraLotePattern = /\b(q|quadra|qd)\b\s*\d+\s*(e|e\s*|)\s*\b(l|lote|lt)\b\s*\d+/i;
  return quadraLotePattern.test(normalizedAddress);
}

function buildLocationIQQueryParam(row: any) {
  const parts = [];
  // Prioritize rawAddress (Destination Address) as it contains full info
  if (row.rawAddress) parts.push(row.rawAddress);
  // Add bairro, cidade, estado as additional context if available
  if (row.bairro) parts.push(row.bairro);
  if (row.cidade) parts.push(row.cidade);
  if (row.estado) parts.push(row.estado);
  return parts.join(", ");
}

// Calculate confidence score for address matching
function calculateAddressConfidence(geocodedAddress: any, expected: any): number {
  if (!geocodedAddress) return 0;
  
  const gotCity = geocodedAddress.city || geocodedAddress.town || geocodedAddress.village || "";
  const gotCounty = geocodedAddress.county || "";
  const gotSuburb = geocodedAddress.suburb || geocodedAddress.neighbourhood || "";
  const gotState = geocodedAddress.state || "";
  const gotRoad = geocodedAddress.road || "";
  const gotHouseNumber = geocodedAddress.house_number || "";

  const expCity = normalizeText(expected.cidade || "");
  const expBairro = normalizeText(expected.bairro || "");
  const expState = normalizeText(expected.estado || "");
  const expRawAddress = normalizeText(expected.rawAddress || "");

  const gCity = normalizeText(gotCity || gotCounty);
  const gBairro = normalizeText(gotSuburb || "");
  const gState = normalizeText(gotState || "");
  const gRoad = normalizeText(gotRoad || "");
  const gHouseNumber = normalizeText(gotHouseNumber || "");

  let score = 0;
  let maxScore = 0;

  // City matching (weight: 30%)
  if (expCity) {
    maxScore += 0.3;
    if (gCity && (gCity.includes(expCity) || expCity.includes(gCity))) {
      score += 0.3;
    }
  }

  // State matching (weight: 20%)
  if (expState) {
    maxScore += 0.2;
    if (gState && (gState.includes(expState) || expState.includes(gState))) {
      score += 0.2;
    }
  }

  // Neighborhood matching (weight: 20%)
  if (expBairro) {
    maxScore += 0.2;
    if (gBairro && (gBairro.includes(expBairro) || expBairro.includes(gBairro))) {
      score += 0.2;
    }
  }

  // Street matching (weight: 20%)
  if (expRawAddress) {
    maxScore += 0.2;
    if (gRoad && expRawAddress.includes(gRoad)) {
      score += 0.15;
    }
    if (gHouseNumber && expRawAddress.includes(gHouseNumber)) {
      score += 0.05;
    }
  }

  // House number presence (weight: 10%)
  if (gHouseNumber) {
    maxScore += 0.1;
    if (expRawAddress.match(/\d+/)) {
      score += 0.1;
    }
  }

  const finalScore = maxScore > 0 ? score / maxScore : 0;
  
  console.log(`  Confidence Score: ${(finalScore * 100).toFixed(1)}%`);
  console.log(`    City: '${expCity}' vs '${gCity}'`);
  console.log(`    Bairro: '${expBairro}' vs '${gBairro}'`);
  console.log(`    State: '${expState}' vs '${gState}'`);
  console.log(`    Road: '${gRoad}', House: '${gHouseNumber}'`);

  return finalScore;
}

// Find best matching result from multiple geocoding results
function findBestMatch(results: any[], expected: any): { result: any, confidence: number } | null {
  if (!results || results.length === 0) return null;
  
  let bestMatch = null;
  let bestConfidence = 0;
  
  for (const result of results) {
    const confidence = calculateAddressConfidence(result.address, expected);
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestMatch = result;
    }
  }
  
  return bestMatch && bestConfidence > 0.3 ? { result: bestMatch, confidence: bestConfidence } : null;
}

// Forward geocoding with fallback to Nominatim
async function forwardGeocode(query: string) {
  const LOCATIONIQ_API_KEY = Deno.env.get('LOCATIONIQ_API_KEY');
  
  // Try LocationIQ first if API key is available
  if (LOCATIONIQ_API_KEY) {
    try {
      const params = new URLSearchParams({
        key: LOCATIONIQ_API_KEY,
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "3", // Get top 3 results for better matching
        country: DEFAULT_COUNTRY_CODE
      });
      const url = `${LOCATIONIQ_API_URL}?${params.toString()}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "RotaSmartApp/1.0 (contact@rotasmart.com)" }
      });
      if (resp.ok) {
        const json = await resp.json();
        await sleep(RATE_LIMIT_DELAY / 2); // Faster rate for LocationIQ
        return json && json.length ? json : null;
      }
    } catch (e) {
      console.warn(`LocationIQ forward geocoding failed: ${e}`);
    }
  }
  
  // Fallback to Nominatim (free, no API key required)
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "3",
      countrycodes: "br"
    });
    const url = `${NOMINATIM_API_URL}?${params.toString()}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "RotaSmartApp/1.0 (contact@rotasmart.com)" }
    });
    if (resp.ok) {
      const json = await resp.json();
      await sleep(RATE_LIMIT_DELAY); // Respect Nominatim rate limit
      return json && json.length ? json : null;
    }
  } catch (e) {
    console.warn(`Nominatim forward geocoding failed: ${e}`);
  }
  
  return null;
}

// Reverse geocoding to validate coordinates
async function reverseGeocode(lat: number, lon: number) {
  const LOCATIONIQ_API_KEY = Deno.env.get('LOCATIONIQ_API_KEY');
  
  // Try LocationIQ first if API key is available
  if (LOCATIONIQ_API_KEY) {
    try {
      const params = new URLSearchParams({
        key: LOCATIONIQ_API_KEY,
        lat: lat.toString(),
        lon: lon.toString(),
        format: "json",
        addressdetails: "1"
      });
      const url = `${LOCATIONIQ_REVERSE_URL}?${params.toString()}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "RotaSmartApp/1.0 (contact@rotasmart.com)" }
      });
      if (resp.ok) {
        const json = await resp.json();
        await sleep(RATE_LIMIT_DELAY / 2);
        return json;
      }
    } catch (e) {
      console.warn(`LocationIQ reverse geocoding failed: ${e}`);
    }
  }
  
  // Fallback to Nominatim
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: "json",
      addressdetails: "1"
    });
    const url = `${NOMINATIM_REVERSE_URL}?${params.toString()}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "RotaSmartApp/1.0 (contact@rotasmart.com)" }
    });
    if (resp.ok) {
      const json = await resp.json();
      await sleep(RATE_LIMIT_DELAY);
      return json;
    }
  } catch (e) {
    console.warn(`Nominatim reverse geocoding failed: ${e}`);
  }
  
  return null;
}

function parseCoordinate(coordString: string | undefined | null): number | undefined {
  if (!coordString) return undefined;
  const cleanedString = String(coordString).replace(',', '.').trim();
  const parsed = parseFloat(cleanedString);
  return isNaN(parsed) ? undefined : parsed;
}

// Helper for approximate distance calculation (meters) using Haversine formula
function getApproximateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; // in metres
  return d;
}

// Helper to check if coordinates are valid (non-zero, within range)
function isValidCoordinate(lat: number | undefined | null, lng: number | undefined | null): boolean {
  if (lat === null || lng === null || lat === undefined || lng === undefined) return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false; // Often indicates invalid data
  return true;
}

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }
  try {
    const { addresses } = await req.json();
    if (!Array.isArray(addresses)) {
      throw new Error('Input must be an array of addresses.');
    }
    const results = [];
    for(let i = 0; i < addresses.length; i++){
      const row = addresses[i];
      let searchUsed = "";
      let status = "pending";
      let note = "";

      let finalLat: string | undefined = undefined;
      let finalLon: string | undefined = undefined;
      let finalCorrectedAddress: string | undefined = undefined; 
      let fullGeocodedAddress: string | undefined = undefined; // Stores verbose display_name from LocationIQ

      const originalLatNum = parseCoordinate(row.latitude);
      const originalLonNum = parseCoordinate(row.longitude);
      const hasOriginalCoords = isValidCoordinate(originalLatNum, originalLonNum);

      let locationIqLat: number | undefined = undefined;
      let locationIqLon: number | undefined = undefined;
      let locationIqDisplayName: string | undefined = undefined;
      let locationIqMatch = false;

      console.log(`--- Processing address ${i + 1} ---`);
      console.log(`  Input rawAddress: '${row.rawAddress}'`);
      console.log(`  Input bairro: '${row.bairro}'`);
      console.log(`  Input cidade: '${row.cidade}'`);
      console.log(`  Input estado: '${row.estado}'`);
      console.log(`  Has original coords: ${hasOriginalCoords} (Lat: ${originalLatNum}, Lon: ${originalLonNum})`);
      console.log(`  Is learned: ${row.learned}`);

      // --- NEW LOGIC: Prioritize learned coordinates if available and valid ---
      if (row.learned && hasOriginalCoords) {
        finalLat = originalLatNum!.toFixed(6);
        finalLon = originalLonNum!.toFixed(6);
        finalCorrectedAddress = row.rawAddress; // Use rawAddress for consistency with learning key
        status = "atualizado"; // Mark as manually updated/learned
        note = (note ? note + ";" : "") + "coordenadas-aprendidas-usadas";
        console.log(`  Learned coordinates found and valid. Using them. Status: ${status}`);
      } else if (row.rawAddress && isQuadraLote(row.rawAddress)) {
        status = "pending";
        finalCorrectedAddress = row.rawAddress; // Keep rawAddress for manual review context
        note = (note ? note + ";" : "") + "quadra-lote-manual-review";
        console.log(`  Detected as 'quadra e lote'. Status: ${status}`);
        // Skip further geocoding for these, they need manual adjustment
      } else {
        // Enhanced geocoding logic with cross-validation
        if (row.rawAddress) {
          const fullQuery = buildLocationIQQueryParam(row);
          console.log(`  Full query for geocoding: '${fullQuery}'`);
          
          try {
            searchUsed = "geocode:" + fullQuery;
            
            // Step 1: Forward geocoding
            const forwardResults = await forwardGeocode(fullQuery);
            
            if (forwardResults && forwardResults.length > 0) {
              console.log(`  Forward geocoding returned ${forwardResults.length} results`);
              
              // Find best matching result
              const bestMatch = findBestMatch(forwardResults, {
                rawAddress: row.rawAddress,
                bairro: row.bairro,
                cidade: row.cidade,
                estado: row.estado
              });
              
              if (bestMatch) {
                const { result, confidence } = bestMatch;
                console.log(`  Best match confidence: ${(confidence * 100).toFixed(1)}%`);
                console.log(`  Best match: Lat=${result.lat}, Lon=${result.lon}`);
                
                locationIqLat = parseCoordinate(result.lat);
                locationIqLon = parseCoordinate(result.lon);
                locationIqDisplayName = result.display_name;
                
                // Step 2: Cross-validate with original coordinates if available
                if (hasOriginalCoords) {
                  console.log(`  Cross-validating with original coordinates...`);
                  
                  // Reverse geocode original coordinates
                  const reverseResult = await reverseGeocode(originalLatNum!, originalLonNum!);
                  
                  if (reverseResult && reverseResult.address) {
                    const reverseConfidence = calculateAddressConfidence(reverseResult.address, {
                      rawAddress: row.rawAddress,
                      bairro: row.bairro,
                      cidade: row.cidade,
                      estado: row.estado
                    });
                    
                    console.log(`  Reverse geocoding confidence: ${(reverseConfidence * 100).toFixed(1)}%`);
                    
                    // If both forward and reverse have high confidence, use the one closer to original
                    if (reverseConfidence >= HIGH_CONFIDENCE_THRESHOLD && confidence >= HIGH_CONFIDENCE_THRESHOLD) {
                      locationIqMatch = true;
                      note = (note ? note + ";" : "") + `confianca-alta-forward:${(confidence * 100).toFixed(0)}%-reverse:${(reverseConfidence * 100).toFixed(0)}%`;
                    } else if (reverseConfidence >= HIGH_CONFIDENCE_THRESHOLD) {
                      // Original coordinates are good
                      locationIqMatch = true;
                      locationIqLat = originalLatNum;
                      locationIqLon = originalLonNum;
                      note = (note ? note + ";" : "") + `coordenadas-originais-validadas:${(reverseConfidence * 100).toFixed(0)}%`;
                    } else if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
                      // Forward geocoding is better
                      locationIqMatch = true;
                      note = (note ? note + ";" : "") + `geocodificacao-corrigida:${(confidence * 100).toFixed(0)}%`;
                    } else {
                      // Medium confidence, needs review
                      locationIqMatch = true;
                      note = (note ? note + ";" : "") + `confianca-media-revisao-sugerida:${(Math.max(confidence, reverseConfidence) * 100).toFixed(0)}%`;
                    }
                  } else {
                    // Reverse geocoding failed, use forward result if confidence is good
                    if (confidence >= 0.5) {
                      locationIqMatch = true;
                      note = (note ? note + ";" : "") + `geocodificado:${(confidence * 100).toFixed(0)}%`;
                    } else {
                      note = (note ? note + ";" : "") + `confianca-baixa-revisao-necessaria:${(confidence * 100).toFixed(0)}%`;
                    }
                  }
                } else {
                  // No original coordinates, just use forward result if confidence is acceptable
                  if (confidence >= 0.5) {
                    locationIqMatch = true;
                    note = (note ? note + ";" : "") + `geocodificado:${(confidence * 100).toFixed(0)}%`;
                  } else {
                    note = (note ? note + ";" : "") + `confianca-baixa:${(confidence * 100).toFixed(0)}%`;
                  }
                }
              } else {
                note = (note ? note + ";" : "") + "nenhum-resultado-compativel";
                console.log(`  No results matched expected criteria`);
              }
            } else {
              note = (note ? note + ";" : "") + "endereco-nao-encontrado";
              console.log(`  No geocoding results found`);
            }
          } catch (e) {
            note = (note ? note + ";" : "") + "erro-geocodificacao";
            console.warn(`  Error during geocoding: ${e}`);
          }
        }

        // Decision logic (after potential LocationIQ search)
        if (locationIqMatch && isValidCoordinate(locationIqLat, locationIqLon)) {
          fullGeocodedAddress = locationIqDisplayName; // Store the verbose display_name here
          // LocationIQ found a good match
          if (hasOriginalCoords) {
            console.log(`  Has original coords: ${originalLatNum}, ${originalLonNum}`);
            const distance = getApproximateDistance(originalLatNum!, originalLonNum!, locationIqLat!, locationIqLon!);
            console.log(`  Distance between original and geocoded: ${distance.toFixed(2)} meters`);
            if (distance > DISTANCE_THRESHOLD_METERS) {
              // Significant difference, mark as pending for manual review
              finalLat = originalLatNum!.toFixed(6); // Keep original for context in map editor
              finalLon = originalLonNum!.toFixed(6); // Keep original for context in map editor
              finalCorrectedAddress = row.rawAddress; // Keep rawAddress for manual review context
              status = "pending"; 
              note = (note ? note + ";" : "") + "coordenadas-geocodificadas-diferem-muito-da-planilha-revisao-manual";
              console.log(`  Distance > threshold. Marking as PENDING. Status: ${status}`);
            } else {
              // Small difference, use original rawAddress for grouping, but original coords
              finalLat = originalLatNum!.toFixed(6);
              finalLon = originalLonNum!.toFixed(6);
              finalCorrectedAddress = row.rawAddress; // Use rawAddress to preserve number for grouping
              status = "valid";
              note = (note ? note + ";" : "") + "coordenadas-da-planilha-confirmadas-por-geocodificacao";
              console.log(`  Distance <= threshold. Using original coords, rawAddress for grouping. Status: ${status}`);
            }
          } else {
            // No original coords, use geocoded display name and coords
            finalLat = locationIqLat!.toFixed(6);
            finalLon = locationIqLon!.toFixed(6);
            finalCorrectedAddress = locationIqDisplayName; // Use standardized name for grouping
            status = "valid";
            note = (note ? note + ";" : "") + "geocodificado-locationiq";
            console.log(`  No original coords. Using geocoded name and coords. Status: ${status}`);
          }
        } else if (hasOriginalCoords) {
          // LocationIQ failed or mismatched, but we have valid original coords
          finalLat = originalLatNum!.toFixed(6);
          finalLon = originalLonNum!.toFixed(6);
          finalCorrectedAddress = row.rawAddress; // Keep rawAddress as no better alternative
          status = "valid";
          note = (note ? note + ";" : "") + "coordenadas-da-planilha-usadas-geocodificacao-falhou";
          console.log(`  LocationIQ failed, but has original coords. Using original. Status: ${status}`);
        } else {
          // No valid coords from any source (this is the default 'pending' case)
          status = "pending";
          finalCorrectedAddress = row.rawAddress; // Keep rawAddress for manual review context
          note = (note ? note + ";" : "") + "nao-foi-possivel-obter-coordenadas";
          console.log(`  No valid coords from any source. Status: ${status}`);
        }
      }
      
      results.push({
        ...row,
        originalAddress: row.rawAddress || "",
        correctedAddress: finalCorrectedAddress || row.rawAddress, // Ensure correctedAddress is always set
        latitude: finalLat,
        longitude: finalLon,
        status,
        searchUsed,
        note,
        display_name: fullGeocodedAddress, // Use the new field for the verbose name
        learned: row.learned || false // Ensure learned flag is passed through
      });
      console.log(`--- Final Status for '${row.rawAddress}': ${status}, Corrected Address: '${finalCorrectedAddress}' ---`);
    }
    return new Response(JSON.stringify(results), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in batch-geocode function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});