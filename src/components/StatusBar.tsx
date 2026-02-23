"use client";

import React, { useState, useEffect } from 'react';

const StatusBar = () => {
  const [time, setTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    // 1. Atualização do Horário
    const timer = setInterval(() => setTime(new Date()), 10000);

    // 2. Monitoramento da Bateria
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => setBatteryLevel(Math.round(battery.level * 100));
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
      });
    }

    // 3. Monitoramento da Conexão
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Tenta pegar o tipo de conexão (4G, Wi-Fi, etc) se disponível
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      setConnectionType(conn.effectiveType);
      conn.addEventListener('change', () => setConnectionType(conn.effectiveType));
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const formattedTime = time.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="status-bar flex-shrink-0">
      <span>{formattedTime}</span>
      <div className="flex items-center gap-1.5">
        {/* Sinal de Celular (Simulado baseado em Online/Offline) */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <rect x="0" y="3" width="3" height="9" rx="1" fill="currentColor" opacity={isOnline ? 0.4 : 0.1}/>
          <rect x="4.5" y="2" width="3" height="10" rx="1" fill="currentColor" opacity={isOnline ? 0.6 : 0.1}/>
          <rect x="9" y="0" width="3" height="12" rx="1" fill="currentColor" opacity={isOnline ? 0.8 : 0.1}/>
          <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="currentColor" opacity={isOnline ? 1 : 0.1}/>
        </svg>

        {/* Wi-Fi / Conexão */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 2.5C5.5 2.5 3.3 3.5 1.8 5.2L0 3.4C2 1.3 4.8 0 8 0s6 1.3 8 3.4L14.2 5.2C12.7 3.5 10.5 2.5 8 2.5z" fill="currentColor" opacity={isOnline ? 0.5 : 0.1}/>
          <path d="M8 6.5C6.5 6.5 5.2 7.1 4.3 8.1L2.5 6.3C3.9 4.9 5.9 4 8 4s4.1.9 5.5 2.3L11.7 8.1C10.8 7.1 9.5 6.5 8 6.5z" fill="currentColor" opacity={isOnline ? 0.75 : 0.1}/>
          <circle cx="8" cy="11" r="1.5" fill="currentColor" opacity={isOnline ? 1 : 0.1}/>
        </svg>

        {/* Bateria Real */}
        <div className="relative flex items-center">
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35"/>
            {/* Preenchimento da bateria baseado no nível real */}
            <rect 
              x="2" 
              y="2" 
              width={(17 * batteryLevel) / 100} 
              height="8" 
              rx="1.5" 
              fill={batteryLevel < 20 ? "#ef4444" : "currentColor"}
            />
            <path d="M23 4.5v3a1.5 1.5 0 000-3z" fill="currentColor" opacity="0.4"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;