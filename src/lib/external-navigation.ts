const STORAGE_KEY = 'rotasmart_nav_app';

export type NavApp = 'app' | 'google_maps' | 'waze';

export function getPreferredNavApp(): NavApp {
  return (localStorage.getItem(STORAGE_KEY) as NavApp) || 'app';
}

/**
 * Opens the preferred external navigation app with the given destination.
 * Returns true if an external app was opened, false if built-in map should be used.
 */
export function openExternalNavigation(lat: number, lng: number, label?: string): boolean {
  const app = getPreferredNavApp();

  if (app === 'google_maps') {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
    return true;
  }

  if (app === 'waze') {
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank');
    return true;
  }

  return false;
}
