"use client";

import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, CreditCard, Pencil, Check, X } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface PersonalDataProps {
  onNavigate: (screen: string) => void;
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const PersonalData = ({ onNavigate }: PersonalDataProps) => {
  const { profile, loading, refetch } = useUserProfile();
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEditPhone = () => {
    setPhoneValue(profile?.phone || '');
    setEditingPhone(true);
  };

  const handleSavePhone = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ phone: phoneValue.replace(/\D/g, '') })
      .eq('id', profile.id);

    if (error) {
      toast.error('Erro ao salvar telefone');
    } else {
      toast.success('Telefone atualizado!');
      setEditingPhone(false);
      refetch();
    }
    setSaving(false);
  };

  const fields = [
    {
      icon: User,
      label: 'Nome Completo',
      value: profile?.full_name || '—',
      editable: false,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: Mail,
      label: 'E-mail',
      value: profile?.email || '—',
      editable: false,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      icon: CreditCard,
      label: 'CPF',
      value: profile?.cpf ? formatCpf(profile.cpf) : '—',
      editable: false,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      icon: Phone,
      label: 'Telefone',
      value: profile?.phone ? formatPhone(profile.phone) : '—',
      editable: true,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ];

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
        <h1 className="text-lg font-bold text-gray-900">Dados Pessoais</h1>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
        {fields.map((field, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 ${index !== fields.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-xl ${field.bg} flex items-center justify-center shrink-0`}>
                <field.icon size={20} className={field.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{field.label}</p>
                {field.editable && editingPhone ? (
                  <Input
                    type="tel"
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(formatPhone(e.target.value))}
                    maxLength={15}
                    className="h-8 mt-1 text-sm bg-gray-50 border-gray-200 rounded-lg"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">{field.value}</p>
                )}
              </div>
            </div>

            {field.editable && (
              <div className="shrink-0 ml-2">
                {editingPhone ? (
                  <div className="flex gap-1">
                    <button
                      onClick={handleSavePhone}
                      disabled={saving}
                      className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Check size={16} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditingPhone(false)}
                      className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <X size={16} className="text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEditPhone}
                    className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Pencil size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-6 px-4 leading-relaxed">
        Para alterar nome, e-mail ou CPF, entre em contato com o suporte.
      </p>
    </div>
  );
};

export default PersonalData;
