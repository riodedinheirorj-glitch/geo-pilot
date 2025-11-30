import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const LOCATIONIQ_REVERSE_URL = "https://us1.locationiq.com/v1/reverse.php";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const RATE_LIMIT_DELAY = 1000; // 1 second for Nominatim rate limit

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function reverseGeocode(lat: number, lon: number) {
  const LOCATIONIQ_API_KEY = Deno.env.get('LOCATIONIQ_API_KEY');
  
  // Tenta LocationIQ primeiro se a chave API estiver disponível
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
  
  // Fallback para Nominatim
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();

    if (lat === undefined || lon === undefined) {
      throw new Error('Latitude (lat) and Longitude (lon) are required.');
    }

    const result = await reverseGeocode(lat, lon);

    if (result && result.display_name) {
      return new Response(
        JSON.stringify({ display_name: result.display_name, address: result.address }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "No address found for the coordinates." }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

  } catch (error) {
    console.error('Error in reverse-geocode function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});