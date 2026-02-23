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
  Crown,
  CalendarDays
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscriptionDays } from '@/hooks/useSubscriptionDays';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  onNavigate: (screen: string) => void;
}

const Profile = ({ onNavigate }: ProfileProps) => {
  const { profile, loading } = useUserProfile();
  const { daysRemaining } = useSubscriptionDays();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const menuItems = [
    { icon: Crown, label: 'Assinatura', sub: 'Plano Premium · R$ 34,99/mês', color: 'text-amber-500', bg: 'bg-amber-50', screen: 'subscription' },
    { icon: User, label: 'Dados Pessoais', sub: 'Nome, CPF e Telefone', color: 'text-blue-500', bg: 'bg-blue-50', screen: 'personal-data' },
    { icon: Bell, label: 'Notificações', sub: 'Alertas e avisos', color: 'text-orange-500', bg: 'bg-orange-50', screen: 'notifications' },
    { icon: Shield, label: 'Segurança', sub: 'Senha e biometria', color: 'text-green-500', bg: 'bg-green-50', screen: 'security' },
    { icon: Settings, label: 'Preferências', sub: 'Mapa e navegação', color: 'text-purple-500', bg: 'bg-purple-50', screen: 'preferences' },
    { icon: HelpCircle, label: 'Ajuda e Suporte', sub: 'FAQ e contato', color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#F4F6F9] px-4 sm:px-5 pb-8 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Header / User Info */}
      <div className="pt-8 pb-6 flex flex-col items-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-[32px] bg-white shadow-card flex items-center justify-center border-4 border-white overflow-hidden">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'User'}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-full border-4 border-[#F4F6F9] flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Motorista'}</h2>
      </div>

      {/* Subscription Days */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <CalendarDays size={22} className="text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Dias de Assinatura</p>
          <p className="text-[11px] text-gray-400 font-medium">
            {daysRemaining !== null && daysRemaining > 0
              ? `Você ainda tem ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
              : 'Nenhum dia restante'}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-extrabold ${daysRemaining !== null && daysRemaining > 0 ? 'text-blue-500' : 'text-red-400'}`}>
            {daysRemaining ?? 0}
          </span>
          <p className="text-[10px] text-gray-400 font-bold uppercase">dias</p>
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
      <button 
        onClick={handleLogout}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-red-50 flex items-center justify-center gap-2 text-red-500 font-bold text-sm active:scale-[0.98] transition-transform"
      >
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