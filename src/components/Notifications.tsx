import React from 'react';
import { ArrowLeft, Package, Crown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useSubscriptionDays } from '@/hooks/useSubscriptionDays';
import { useReadNotifications, markNotificationRead } from '@/hooks/useReadNotifications';

interface NotificationsProps {
  onNavigate: (screen: string) => void;
}

interface Notification {
  id: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  action?: { label: string; screen: string };
}

const baseNotifications: Notification[] = [
  {
    id: 1,
    icon: Package,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Rota otimizada com sucesso',
    description: '47 pacotes organizados na melhor sequência.',
    time: 'Hoje, 08:32',
    read: false,
  },
  {
    id: 2,
    icon: Crown,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Bem-vindo ao RotaSmart!',
    description: 'Assine o plano Premium para começar a otimizar suas rotas de entrega.',
    time: 'Ontem, 14:10',
    read: false,
    action: { label: 'Ver planos', screen: 'subscription' },
  },
  {
    id: 4,
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50',
    title: 'Pagamento confirmado',
    description: 'Sua assinatura Premium foi ativada por 30 dias.',
    time: '15 fev, 11:45',
    read: true,
  },
  {
    id: 5,
    icon: Info,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Nova atualização disponível',
    description: 'Versão 2.4.0 traz melhorias no mapa e correções de bugs.',
    time: '10 fev, 16:20',
    read: true,
  },
];

export function getNotifications(daysRemaining: number | null): Notification[] {
  const list: Notification[] = [];

  if (daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 5) {
    list.push({
      id: 100,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      title: daysRemaining === 1 ? 'Último dia de assinatura!' : `Assinatura expira em ${daysRemaining} dias`,
      description: 'Renove agora e não perca suas rotas otimizadas — cada dia sem o RotaSmart é dinheiro e tempo perdidos.',
      time: 'Agora',
      read: false,
      action: { label: 'Renovar agora', screen: 'subscription' },
    });
  }

  if (daysRemaining !== null && daysRemaining === 0) {
    list.push({
      id: 101,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50',
      title: 'Assinatura expirada',
      description: 'Seu plano Premium expirou. Renove para continuar usando rotas otimizadas.',
      time: 'Agora',
      read: false,
      action: { label: 'Renovar agora', screen: 'subscription' },
    });
  }

  return [...list, ...baseNotifications];
}

export function getNotificationCount(daysRemaining: number | null, readIds: Set<number>): number {
  return getNotifications(daysRemaining).filter(n => !n.read && !readIds.has(n.id)).length;
}

const Notifications = ({ onNavigate }: NotificationsProps) => {
  const { daysRemaining } = useSubscriptionDays();
  const readIds = useReadNotifications();
  const notifications = getNotifications(daysRemaining).map(n => ({
    ...n,
    read: n.read || readIds.has(n.id),
  }));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full bg-background px-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4 pb-5">
        <button
          onClick={() => onNavigate("dashboard")}
          className="w-10 h-10 rounded-2xl bg-card shadow-card flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Notificações</h1>
        {unreadCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            {unreadCount} nova{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Notification list */}
      <div className="flex flex-col gap-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markNotificationRead(n.id)}
            className={`bg-card rounded-2xl p-4 shadow-card flex items-start gap-3 cursor-pointer transition-all ${!n.read ? 'border-l-4 border-primary' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl ${n.bg} flex items-center justify-center shrink-0 mt-0.5`}>
              <n.icon size={18} className={n.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{n.description}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">{n.time}</p>
              {n.action && (
                <button
                  onClick={() => onNavigate(n.action!.screen)}
                  className="mt-2 text-[12px] font-bold text-primary underline"
                >
                  {n.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-6">
        Essas são suas notificações recentes.
      </p>
    </div>
  );
};

export default Notifications;
