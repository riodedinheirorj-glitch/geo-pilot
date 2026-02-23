import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HudRings from "./HudRings";

type Mode = "login" | "signup" | "forgot";

interface Props {
  onSuccess: () => void;
}

const HudLoginScreen = ({ onSuccess }: Props) => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Floating particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 10}s`,
    size: Math.random() * 2 + 1,
  }));

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      onSuccess();
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: name,
      });
    }
    setLoading(false);
    toast.success("Verifique seu email para confirmar o cadastro!");
    setMode("login");
  };

  const handleForgot = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email de recuperação enviado!");
      setMode("login");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else if (mode === "signup") handleSignup();
    else handleForgot();
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0a0e1a] flex items-center justify-center px-4 py-8">
      {/* Grid background */}
      <div className="hud-grid-bg absolute inset-0" />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-[hud-float_linear_infinite] pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.id % 3 === 0 ? "#00d4ff" : p.id % 3 === 1 ? "#7b61ff" : "#00ff88",
            opacity: 0.4,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: `0 0 ${p.size * 3}px currentColor`,
          }}
        />
      ))}

      {/* Rings + Form */}
      <div className="relative z-10 flex items-center justify-center">
        <HudRings />

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="relative z-20 w-[300px] sm:w-[320px] bg-black/50 backdrop-blur-md border border-[#00d4ff]/20 rounded-2xl p-6 space-y-4"
          style={{ boxShadow: "0 0 40px rgba(0, 212, 255, 0.08)" }}
        >
          {/* Logo */}
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold tracking-wider" style={{ color: "#00d4ff" }}>
              ROTA
              <span style={{ color: "#7b61ff" }}>SMART</span>
            </h1>
            <p className="text-[10px] font-mono text-[#00d4ff]/40 mt-1 tracking-widest uppercase">
              {mode === "login"
                ? "Authentication Required"
                : mode === "signup"
                ? "New User Registration"
                : "Password Recovery"}
            </p>
          </div>

          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="hud-input"
                required
              />
              <input
                type="tel"
                placeholder="Telefone (opcional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="hud-input"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="hud-input"
            required
          />

          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="hud-input"
              required
              minLength={6}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #7b61ff)",
              color: "#0a0e1a",
              boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
            }}
          >
            {loading
              ? "Processando..."
              : mode === "login"
              ? "ACESSAR SISTEMA"
              : mode === "signup"
              ? "REGISTRAR"
              : "ENVIAR LINK"}
          </button>

          {/* Links */}
          <div className="text-center space-y-1.5 text-[11px] font-mono">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="block w-full text-[#00d4ff]/50 hover:text-[#00d4ff] transition-colors"
                >
                  Esqueceu a senha?
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="block w-full text-[#7b61ff]/60 hover:text-[#7b61ff] transition-colors"
                >
                  Criar nova conta
                </button>
              </>
            )}
            {mode === "signup" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="block w-full text-[#00d4ff]/50 hover:text-[#00d4ff] transition-colors"
              >
                Já tenho uma conta
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="block w-full text-[#00d4ff]/50 hover:text-[#00d4ff] transition-colors"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default HudLoginScreen;
