import { useEffect } from "react";

interface CenteredPopupProps {
  open: boolean;
  onClose: () => void;
  message: string;
  duration?: number;
  durationMs?: number;
}

export function CenteredPopup({ open, onClose, message, duration, durationMs }: CenteredPopupProps) {
  const timeout = durationMs ?? duration ?? 2000;
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, timeout);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, duration]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card px-8 py-6 rounded-2xl shadow-xl text-center">
        <p className="text-lg font-semibold text-foreground">{message}</p>
      </div>
    </div>
  );
}
