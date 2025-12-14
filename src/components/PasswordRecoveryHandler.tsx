import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PasswordRecoveryHandlerProps {
  onRecoveryDetected: () => void;
}

export function PasswordRecoveryHandler({ onRecoveryDetected }: PasswordRecoveryHandlerProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const checkForPasswordRecovery = async () => {
      // Verificar parâmetros da URL para recuperação de senha
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      
      if (type === "recovery") {
        // Remover parâmetros da URL para evitar processamento repetido
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Notificar que o modo de recuperação foi detectado
        onRecoveryDetected();
        toast.info("Defina sua nova senha");
      }
    };

    checkForPasswordRecovery();
    
    // Listener para mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        onRecoveryDetected();
        toast.info("Defina sua nova senha");
      }
    });

    return () => subscription?.unsubscribe();
  }, [onRecoveryDetected]);

  return null;
}