import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Loader2, MapPin } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      navigate("/auth", { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #1b2838 100%)" }}>
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{ background: "linear-gradient(135deg, #2F80ED, #7B61FF)" }}>
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nova senha</h1>
        </div>

        <div className="rounded-3xl p-8 backdrop-blur-xl border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          {valid ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  placeholder="Nova senha (min. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #2F80ED, #7B61FF)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Redefinir senha</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <p className="text-gray-400 text-center text-sm">Link inválido ou expirado. Solicite um novo link de redefinição.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
