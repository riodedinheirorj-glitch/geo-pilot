import { useState } from "react";
import { Mail, Eye, EyeOff, Lock } from "lucide-react";
import loginHeader from "@/assets/login-header.png";
import loginBg from "@/assets/login-bg.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Digite seu e-mail", description: "Informe o e-mail para redefinir a senha.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada." });
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30">
      <div className="relative w-full max-w-sm min-h-[100dvh] sm:min-h-[812px] sm:rounded-3xl overflow-hidden flex flex-col">
        {/* Background image - fills entire mobile frame */}
        <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 0%' }} />

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col flex-1 justify-end px-3 pb-4 pt-10 safe-bottom">
          {/* Header image */}
          



          <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-card p-4 border border-border/50 pt-[27px]">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <Mail size={12} className="text-muted-foreground" />
                E-mail
              </label>
              <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 rounded-lg bg-background/60 border-border/60 text-sm text-foreground placeholder:text-muted-foreground/60"
                  required />

            </div>

            {/* Senha */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Lock size={12} className="text-muted-foreground" />
                  Senha
                </label>
                {!isSignUp &&
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] text-primary hover:underline">

                    Esqueceu sua senha?
                  </button>
                  }
              </div>
              <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 rounded-lg bg-background/60 border-border/60 pr-9 text-sm text-foreground placeholder:text-muted-foreground/60"
                    required />

                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">

                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Entrar */}
            <Button
                type="submit"
                disabled={loading}
                className="w-full h-9 rounded-lg text-sm font-semibold gradient-primary shadow-button hover:opacity-90 transition-opacity">

              {loading ? "Carregando..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google */}
            <Button
                type="button"
                variant="outline"
                className="w-full h-9 rounded-lg text-xs font-medium border-border/60 bg-background/60 hover:bg-accent"
                onClick={() => toast({ title: "Em breve", description: "Login com Google será habilitado em breve." })}>

              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar com Google
            </Button>
          </form>

          {/* Toggle signup/login */}
          <p className="text-center mt-3 text-xs text-muted-foreground">
            {isSignUp ? "Já tem conta? " : "Novo por aqui? "}
            <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-semibold hover:underline">

              {isSignUp ? "Entrar" : "Criar conta gratuita"}
            </button>
          </p>
        </div>

        </div>
      </div>
    </div>);

};

export default Auth;