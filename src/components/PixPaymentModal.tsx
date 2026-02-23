import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, QrCode, Clock, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';

interface PixPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
}

const PIX_CODE = "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540534.995802BR5925ROTASMART TECNOLOGIA LT6009SAO PAULO62070503***6304A1B2";

const EXPIRATION_MINUTES = 15;

const PixPaymentModal = ({ open, onClose, onPaymentConfirmed }: PixPaymentModalProps) => {
  const [timeLeft, setTimeLeft] = useState(EXPIRATION_MINUTES * 60);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeLeft(EXPIRATION_MINUTES * 60);
      setCopied(false);
      setConfirmed(false);
      setConfirming(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(PIX_CODE).then(() => {
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      toast.error('Erro ao copiar');
    });
  }, []);

  const handleConfirmPayment = () => {
    setConfirming(true);
    // Simulate payment verification
    setTimeout(() => {
      setConfirmed(true);
      setConfirming(false);
      setTimeout(() => {
        onPaymentConfirmed();
      }, 2000);
    }, 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[400px] bg-card rounded-t-[28px] p-6 pb-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X size={16} className="text-muted-foreground" />
        </button>

        {confirmed ? (
          /* Success State */
          <div className="flex flex-col items-center pt-8 pb-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-in zoom-in duration-300">
              <PartyPopper size={36} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Pagamento Confirmado!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Sua assinatura Premium está ativa por 30 dias. Aproveite! 🚀
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-foreground">Pagamento via PIX</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Escaneie o QR Code ou copie o código
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <Clock size={14} className="text-muted-foreground" />
              <span className={`text-sm font-bold ${timeLeft < 120 ? 'text-red-500' : 'text-muted-foreground'}`}>
                Expira em {formatTime(timeLeft)}
              </span>
            </div>

            {/* QR Code (simulated) */}
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center mb-5 border border-border">
              <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center mb-3 relative overflow-hidden">
                <div className="grid grid-cols-8 gap-[2px] w-40 h-40">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-[1px] ${
                        Math.random() > 0.4 ? 'bg-foreground' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <QrCode size={20} className="text-primary" />
                  </div>
                </div>
              </div>
              <p className="text-lg font-bold text-foreground">R$ 34,99</p>
              <p className="text-xs text-muted-foreground">RotaSmart Tecnologia</p>
            </div>

            {/* Copy Code */}
            <button
              onClick={handleCopy}
              className="w-full bg-muted rounded-2xl p-4 flex items-center justify-between mb-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex-1 mr-3">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">
                  Código PIX copia e cola
                </p>
                <p className="text-xs text-foreground font-mono truncate">
                  {PIX_CODE.substring(0, 40)}...
                </p>
              </div>
              {copied ? (
                <Check size={18} className="text-emerald-500 shrink-0" />
              ) : (
                <Copy size={18} className="text-muted-foreground shrink-0" />
              )}
            </button>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmPayment}
              disabled={confirming || timeLeft === 0}
              className="w-full gradient-primary text-white font-bold text-sm py-4 rounded-[16px] shadow-button flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando pagamento...
                </>
              ) : timeLeft === 0 ? (
                'QR Code expirado'
              ) : (
                'JÁ PAGUEI'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PixPaymentModal;
