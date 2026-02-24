"use client";

import React from 'react';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Star, 
  Package, 
  Map as MapIcon,
  Crown
} from 'lucide-react';

interface ProfileProps {
  onNavigate: (screen: string) => void;
}

const Profile = ({ onNavigate }: ProfileProps) => {
  const menuItems = [
    { icon: Crown, label: 'Assinatura', sub: 'Plano Premium · R$ 34,99/mês', color: 'text-amber-500', bg: 'bg-amber-50', screen: 'subscription' },
    { icon: User, label: 'Dados Pessoais', sub: 'Nome, CPF e Telefone', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Bell, label: 'Notificações', sub: 'Alertas e avisos', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Shield, label: 'Segurança', sub: 'Senha e biometria', color: 'text-green-500', bg: 'bg-green-50' },
    { icon: Settings, label: 'Preferências', sub: 'Mapa e navegação', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: HelpCircle, label: 'Ajuda e Suporte', sub: 'FAQ e contato', color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9] px-5 pb-8">
      {/* Header / User Info */}
      <div className="pt-8 pb-6 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-[32px] bg-white shadow-card flex items-center justify-center border-4 border-white overflow-hidden">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Paulo" 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-full border-4 border-[#F4F6F9] flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Paulo Silveira</h2>
        <p className="text-sm text-gray-500 font-medium">Motorista Parceiro · Nível 4</p>
        
        <div className="flex items-center gap-1 mt-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-gray-700">4.9</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 flex flex-col items-center">
          <Package size={18} className="text-blue-500 mb-1" />
          <span className="text-lg font-bold text-gray-900">1.2k</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase">Entregas</span>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 flex flex-col items-center">
          <MapIcon size={18} className="text-purple-500 mb-1" />
          <span className="text-lg font-bold text-gray-900">840</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase">Km Rodados</span>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 flex flex-col items-center">
          <div className="w-[18px] h-[18px] rounded-full bg-green-500 flex items-center justify-center mb-1">
            <span className="text-[10px] text-white font-bold">$</span>
          </div>
          <span className="text-lg font-bold text-gray-900">R$ 2k</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase">Ganhos</span>
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden mb-6">
        {menuItems.map((item, index) => (
          <button 
            key={index}
            onClick={() => item.screen && onNavigate(item.screen)}
            className={`w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <item.icon size={20} className={item.color} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-[11px] text-gray-400 font-medium">{item.sub}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-red-50 flex items-center justify-center gap-2 text-red-500 font-bold text-sm active:scale-[0.98] transition-transform">
        <LogOut size={18} />
        SAIR DA CONTA
      </button>

      <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-8">
        RotaSmart v2.4.0
      </p>
    </div>
  );
};

export default Profile;