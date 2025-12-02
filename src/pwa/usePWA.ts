import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Verifica se já está instalado (melhorada para mobile)
    const checkInstalled = () => {
      // Verifica display mode standalone (funciona em Chrome/Edge Android e Safari iOS)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Verifica iOS standalone
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      // Verifica se foi lançado como app no Android
      const isAndroidApp = window.matchMedia('(display-mode: standalone)').matches ||
                          window.matchMedia('(display-mode: fullscreen)').matches ||
                          window.matchMedia('(display-mode: minimal-ui)').matches;
      
      // Verifica user agent para detectar TWA (Trusted Web Activity) no Android
      const isTWA = document.referrer.includes('android-app://');
      
      const installed = isStandalone || isIOSStandalone || isAndroidApp || isTWA;
      setIsInstalled(installed);
      
      console.log('🔍 PWA Installation Check:', {
        isStandalone,
        isIOSStandalone,
        isAndroidApp,
        isTWA,
        installed
      });
    };

    checkInstalled();

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      console.log('💾 PWA instalável');
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('✅ PWA instalado');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('❌ Nenhum prompt de instalação disponível');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Usuário aceitou instalar');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('❌ Usuário recusou instalar');
        return false;
      }
    } catch (error) {
      console.error('Erro ao mostrar prompt de instalação:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}
