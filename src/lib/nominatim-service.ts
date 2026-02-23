export interface ProcessedAddress {
  originalAddress: string;
  correctedAddress: string;
  latitude: string;
  longitude: string;
  status: 'valid' | 'corrected' | 'error' | 'atualizado';
  note?: string;
  learned?: boolean;
}

export async function geocodeSingleAddress(query: string): Promise<{ lat: string; lon: string; display_name: string } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon, display_name: data[0].display_name };
    }
    return null;
  } catch {
    return null;
  }
}

export async function reverseGeocodeAddress(lat: number, lng: number): Promise<{ display_name: string; address?: any } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    if (data && data.display_name) {
      return { display_name: data.display_name, address: data.address };
    }
    return null;
  } catch {
    return null;
  }
}
