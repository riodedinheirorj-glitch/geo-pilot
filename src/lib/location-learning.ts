export function buildLearningKey(address: { originalAddress?: string; correctedAddress?: string }): string {
  return (address.correctedAddress || address.originalAddress || "").trim().toLowerCase();
}

export function saveLearnedLocation(key: string, lat: number, lng: number): void {
  try {
    const stored = JSON.parse(localStorage.getItem("learned_locations") || "{}");
    stored[key] = { lat, lng, updatedAt: Date.now() };
    localStorage.setItem("learned_locations", JSON.stringify(stored));
  } catch { /* ignore */ }
}

export function getLearnedLocation(key: string): { lat: number; lng: number } | null {
  try {
    const stored = JSON.parse(localStorage.getItem("learned_locations") || "{}");
    return stored[key] || null;
  } catch {
    return null;
  }
}
