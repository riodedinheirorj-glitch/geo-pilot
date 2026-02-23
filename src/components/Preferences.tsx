import React from 'react';
import { ArrowLeft, Navigation, Check } from 'lucide-react';
import { useState } from 'react';
import iconGoogleMaps from '@/assets/icon-google-maps.png';
import iconWaze from '@/assets/icon-waze.png';
import iconApp from '@/assets/rotasmart-logo-2.png';

interface PreferencesProps {
  onNavigate: (screen: string) => void;
}

const NAV_OPTIONS = [
  {
    id: 'app',
    label: 'Mapa do Aplicativo',
    description: 'Navegação integrada no RotaSmart',
    image: iconApp,
  },
  {
    id: 'google_maps',
    label: 'Google Maps',
    description: 'Abrir rotas no Google Maps',
    image: iconGoogleMaps,
  },
  {
    id: 'waze',
    label: 'Waze',
    description: 'Abrir rotas no Waze',
    image: iconWaze,
  },
] as const;

type NavAppId = typeof NAV_OPTIONS[number]['id'];

const STORAGE_KEY = 'rotasmart_nav_app';

const Preferences = ({ onNavigate }: PreferencesProps) => {
  const [selected, setSelected] = useState<NavAppId>(() => {
    return (localStorage.getItem(STORAGE_KEY) as NavAppId) || 'app';
  });

  const handleSelect = (id: NavAppId) => {
    setSelected(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-6">
        <button
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Preferências</h1>
      </div>

      <div className="px-5">
        {/* Navigation App Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Navigation size={16} className="text-purple-500" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">App de Navegação</p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Escolha qual aplicativo usar para navegar até os endereços da sua rota.
          </p>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden mb-6">
          {NAV_OPTIONS.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors ${
                index !== NAV_OPTIONS.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img src={option.image} alt={option.label} className="w-7 h-7 object-contain" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{option.label}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{option.description}</p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected === option.id
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {selected === option.id && <Check size={14} className="text-white" />}
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-purple-50 rounded-2xl p-4 mb-8">
          <p className="text-xs text-purple-700 font-medium leading-relaxed">
            💡 Ao escolher Google Maps ou Waze, o aplicativo externo será aberto automaticamente ao iniciar a navegação para cada parada da rota.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
