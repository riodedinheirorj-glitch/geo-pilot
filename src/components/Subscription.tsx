import React, { useState } from 'react';
import { 
  Crown, 
  Check, 
  ArrowLeft, 
  Zap, 
  Route, 
  Headphones, 
  BarChart3,
  Shield
} from 'lucide-react';
import PixPaymentModal from './PixPaymentModal';

interface SubscriptionProps {
  onNavigate: (screen: string) => void;
}

const Subscription = ({ onNavigate }: SubscriptionProps) => {
  const [showPixModal, setShowPixModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const benefits = [
    { icon: Route, label: 'Rotas ilimitadas', desc: 'Otimize quantas rotas quiser' },
    { icon: Zap, label: 'Otimização avançada', desc: 'Algoritmo de IA para melhor rota' },
    { icon: BarChart3, label: 'Relatórios completos', desc: 'Métricas e economia detalhada' },
    { icon: Headphones, label: 'Suporte prioritário', desc: 'Atendimento em até 2h' },
    { icon: Shield, label: 'Sem anúncios', desc: 'Experiência limpa e focada' },
  ];

  const handlePaymentConfirmed = () => {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30);
    setExpiresAt(expDate);
    setIsSubscribed(true);
    setShowPixModal(false);
  };

  const daysRemaining = expiresAt 
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="flex flex-col h-full bg-background px-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-5">
        <button 
          onClick={() => onNavigate("profile")}
          className="w-10 h-10 rounded-2xl bg-card shadow-card flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Assinatura</h1>
      </div>

      {/* Status Badge */}
      {isSubscribed && expiresAt && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Check size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">Assinatura Ativa</p>
            <p className="text-xs text-emerald-600">
              Expira em {daysRemaining} dias · {expiresAt.toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}

      {/* Plan Card */}
      <div className="bg-card rounded-[24px] shadow-card overflow-hidden mb-5">
        {/* Plan Header */}
        <div className="gradient-primary p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Crown size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Plano Premium</h2>
          <div className="flex items-baseline justify-center gap-1 mt-2">
            <span className="text-sm text-white/70">R$</span>
            <span className="text-4xl font-extrabold text-white">34</span>
            <span className="text-xl font-bold text-white">,99</span>
            <span className="text-sm text-white/70">/mês</span>
          </div>
          <p className="text-xs text-white/60 mt-1">Cobrado mensalmente via PIX</p>
        </div>

        {/* Benefits */}
        <div className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            O que está incluso
          </p>
          <div className="flex flex-col gap-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.label}</p>
                  <p className="text-[11px] text-muted-foreground">{b.desc}</p>
                </div>
                <Check size={16} className="text-emerald-500 ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      {!isSubscribed ? (
        <button
          onClick={() => setShowPixModal(true)}
          className="w-full gradient-primary text-white font-bold text-base py-4 rounded-[16px] shadow-button flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Crown size={18} />
          ASSINAR AGORA — R$ 34,99
        </button>
      ) : (
        <div className="bg-card rounded-2xl p-4 shadow-card text-center">
          <p className="text-sm text-muted-foreground">Você já é assinante Premium! 🎉</p>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground mt-4">
        Cancele quando quiser · Sem fidelidade
      </p>

      {/* PIX Modal */}
      <PixPaymentModal
        open={showPixModal}
        onClose={() => setShowPixModal(false)}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
};

export default Subscription;
