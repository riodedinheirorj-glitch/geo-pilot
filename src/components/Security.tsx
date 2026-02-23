"use client";

import React, { useState } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SecurityProps {
  onNavigate: (screen: string) => void;
}

const Security = ({ onNavigate }: SecurityProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Informe sua senha atual');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);

    // Verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error('Erro ao identificar usuário');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      toast.error('Senha atual incorreta');
      setLoading(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error('Erro ao alterar senha');
    } else {
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9] px-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-6 pb-6">
        <button
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Segurança</h1>
      </div>

      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
          <ShieldCheck size={32} className="text-green-500" />
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 p-5 space-y-4">
        <p className="text-sm font-bold text-gray-900 mb-1">Alterar Senha</p>

        {/* Current Password */}
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Senha Atual</label>
          <div className="relative">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 pr-10 bg-gray-50 border-gray-200 rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Nova Senha</label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-11 pr-10 bg-gray-50 border-gray-200 rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Confirmar Nova Senha</label>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="h-11 pr-10 bg-gray-50 border-gray-200 rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full h-12 rounded-xl text-sm font-bold bg-green-500 hover:bg-green-600 text-white mt-2"
        >
          {loading ? 'Salvando...' : 'Alterar Senha'}
        </Button>
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-6 px-4 leading-relaxed">
        Sua senha deve ter no mínimo 6 caracteres. Após a alteração, você continuará logado.
      </p>
    </div>
  );
};

export default Security;
