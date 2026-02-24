"use client";

import React, { useState, useEffect } from "react";
import { Bell, MapPin, Clock, TrendingUp, FileUp, History, Crown } from "lucide-react";

interface DashboardProps {
  onNavigate: (screen: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [greeting, setGreeting] = useState("Bom dia");
  const [currentDate, setCurrentDate] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    // 1. Definir saudação baseada no horário
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");

    // 2. Definir data formatada
    const date = new Date();
    const formattedDate = date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    });
    setCurrentDate(formattedDate);

    // 3. Buscar localização via GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || "";
            const state = data.address.state || "";
            
            if (city || state) {
              setLocation(`${city}${city && state ? " · " : ""}${state}`);
            }
          } catch (error) {
            console.error("Erro ao buscar localização", error);
          }
        },
        (error) => {
          console.error("Erro de geolocalização", error);
        }
      );
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-background px-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between pt-4 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {greeting}, Paulo 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin size={12} className="text-primary" />
            {currentDate}{location ? ` · ${location}` : ""}
          </p>
        </div>
        <button className="relative w-10 h-10 rounded-2xl bg-card shadow-card flex items-center justify-center">
          <Bell size={18} className="text-foreground" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            1
          </span>
        </button>
      </div>

      {/* Subscription Banner */}
      <button
        onClick={() => onNavigate("subscription")}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 mb-4 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-card"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Crown size={20} className="text-white" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-bold text-white">Assine o Premium</p>
          <p className="text-[11px] text-white/80">Rotas ilimitadas por R$ 34,99/mês</p>
        </div>
        <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full">VER</span>
      </button>

      {/* Main delivery card - Historical Data */}
      <div className="bg-card rounded-[20px] shadow-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <History size={14} className="text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Resumo da última rota
          </p>
        </div>
        
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-5xl font-extrabold text-foreground">47</span>
            <span className="text-xl font-semibold text-foreground">Pacotes entregues</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Tempo em rota: <span className="font-semibold text-foreground">3h12</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-[15px] h-[15px] rounded-full bg-success-light flex items-center justify-center">
                <TrendingUp size={9} className="text-success" />
              </div>
              <span className="text-sm text-muted-foreground">
                Economia gerada:{" "}
                <span className="font-bold text-success">+R$42</span>
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onNavigate("import")}
          className="w-full gradient-primary text-white font-bold text-base py-4 rounded-[16px] shadow-button flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <FileUp size={18} />
          IMPORTAR ROMANEIO
        </button>
      </div>

      {/* Mini stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-[16px] shadow-card p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-foreground">12</span>
          <span className="text-xs text-muted-foreground text-center mt-1 leading-tight">Bairros</span>
        </div>
        <div className="bg-card rounded-[16px] shadow-card p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-foreground">3</span>
          <span className="text-xs text-muted-foreground text-center mt-1 leading-tight">Múltiplos volumes</span>
        </div>
        <div className="bg-card rounded-[16px] shadow-card p-4 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-foreground">2</span>
          <span className="text-xs text-muted-foreground text-center mt-1 leading-tight">Endereços repetidos</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Ações rápidas
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate("import")}
            className="flex-1 bg-card rounded-[16px] shadow-card py-4 px-3 text-sm font-semibold text-foreground text-center active:scale-[0.98] transition-transform"
          >
            📄 Importar romaneio
          </button>
          <button
            onClick={() => onNavigate("profile")}
            className="flex-1 bg-card rounded-[16px] shadow-card py-4 px-3 text-sm font-semibold text-foreground text-center active:scale-[0.98] transition-transform"
          >
            👤 Perfil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;