import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const LOCATIONIQ_API_URL = "https://us1.locationiq.com/v1/search.php";
const DEFAULT_COUNTRY_CODE = "Brazil";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      throw new Error('Query parameter is required.');
    }

    const LOCATIONIQ_API_KEY = Deno.env.get('LOCATIONIQ_API_KEY');
    if (!LOCATIONIQ_API_KEY) {
      throw new Error('LOCATIONIQ_API_KEY not configured.');
    }

    const params = new URLSearchParams({
      key: LOCATIONIQ_API_KEY,
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "1",
      country: DEFAULT_COUNTRY_CODE
    });

    const url = `${LOCATIONIQ_API_URL}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RotaSmartApp/1.0 (contact@rotasmart.com)"
      }
    });

    if (!response.ok) {
      console.error("LocationIQ API error:", response.status, response.statusText, url);
      throw new Error(`LocationIQ API returned status ${response.status}`);
    }

    const json = await response.json();
    const result = json && json.length ? json[0] : null;

    if (result) {
      return new Response(
        JSON.stringify({
          lat: result.lat,
          lon: result.lon,
          display_name: result.display_name,
          address: result.address
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "No results found for the query." }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

  } catch (error) {
    console.error('Error in single-geocode function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});