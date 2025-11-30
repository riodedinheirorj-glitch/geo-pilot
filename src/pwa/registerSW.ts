/**
 * Service Worker Registration
 * Integra com vite-plugin-pwa
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker não suportado');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      // O vite-plugin-pwa já registra o SW, então apenas configuramos os listeners
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ativo:', registration.scope);

      // Listener para atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Nova versão do Service Worker encontrada');

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 Nova versão disponível');
              
              // Envia mensagem para o app sobre atualização disponível
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'UPDATE_AVAILABLE',
                });
              }

              // Dispara evento customizado
              window.dispatchEvent(new CustomEvent('swUpdateAvailable'));
            }
          });
        }
      });

      // Listener para mensagens do service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Mensagem do Service Worker:', event.data);

        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          window.dispatchEvent(new CustomEvent('swUpdateAvailable'));
        }
      });

      // Verifica se há uma atualização esperando
      if (registration.waiting) {
        console.log('⏳ Service Worker esperando para ativar');
        window.dispatchEvent(new CustomEvent('swUpdateAvailable'));
      }

      // Verifica atualizações periodicamente (a cada 1 hora)
      setInterval(() => {
        console.log('🔍 Verificando atualizações...');
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    }
  });
}

/**
 * Força atualização do service worker
 */
export async function updateServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      // Envia mensagem para o service worker ativar
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Aguarda o novo service worker assumir controle
      return new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          resolve();
        });
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar service worker:', error);
    throw error;
  }
}
