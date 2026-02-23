import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCpf, formatPhone, unmask } from "@/lib/formatters";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().trim().min(8, "Telefone muito curto").max(20, "Telefone muito longo"),
  cpf: z.string().trim().min(11, "CPF muito curto").max(20, "CPF muito longo"),
}).refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "As senhas não conferem" })
  .refine((d) => unmask(d.cpf).length === 11, { path: ["cpf"], message: "CPF deve ter 11 dígitos" });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthPageProps { session: Session | null; }

const AuthPage = ({ session }: AuthPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const registerForm = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "", cpf: "" } });

  useEffect(() => { document.title = "Login | RotaSmart"; }, []);

  if (session) return <Navigate to="/" replace />;

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
      if (error) { toast({ title: "Erro ao entrar", description: "Verifique seus dados e tente novamente.", variant: "destructive" }); return; }
      navigate("/", { replace: true });
    } finally { setLoading(false); }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("signup-with-uniqueness", {
        body: { name: values.name, email: values.email, password: values.password, phone: unmask(values.phone), cpf: unmask(values.cpf) },
      });
      if (error) { toast({ title: "Erro ao cadastrar", description: "Verifique os dados e tente novamente.", variant: "destructive" }); return; }
      const result = data as { success?: boolean; error?: string; message?: string } | null;
      if (result?.error) { toast({ title: "Erro", description: result.message ?? "Erro ao cadastrar.", variant: "destructive" }); return; }
      toast({ title: "Conta criada", description: "Faça login para começar." });
      setActiveTab("login");
    } finally { setLoading(false); }
  };

  const inputClass = "rounded-xl bg-[hsl(220,20%,96%)] border border-[hsl(220,13%,88%)] focus-visible:ring-2 focus-visible:ring-[hsl(213,83%,56%)] h-12 text-base";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient with network pattern */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, hsl(213 60% 92%) 0%, hsl(220 40% 88%) 40%, hsl(220 30% 82%) 100%)",
        }}
      />
      {/* Decorative geometric lines overlay */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(30deg, transparent 40%, hsl(213 83% 56% / 0.3) 40.5%, hsl(213 83% 56% / 0.3) 41%, transparent 41.5%),
            linear-gradient(150deg, transparent 40%, hsl(260 100% 69% / 0.3) 40.5%, hsl(260 100% 69% / 0.3) 41%, transparent 41.5%),
            linear-gradient(60deg, transparent 55%, hsl(213 83% 56% / 0.2) 55.5%, hsl(213 83% 56% / 0.2) 56%, transparent 56.5%),
            linear-gradient(120deg, transparent 55%, hsl(260 100% 69% / 0.2) 55.5%, hsl(260 100% 69% / 0.2) 56%, transparent 56.5%)
          `,
          backgroundSize: "100% 100%",
        }}
      />
      {/* Sparkle dots */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-sm flex flex-col gap-5 relative z-10 px-6 py-8">
        {/* Brand */}
        <div className="text-center flex flex-col items-center gap-3">
          {/* Map Pin Logo */}
          <div className="relative w-16 h-20 mb-1">
            <svg viewBox="0 0 64 80" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="pinGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(213, 83%, 56%)" />
                  <stop offset="100%" stopColor="hsl(260, 100%, 69%)" />
                </linearGradient>
              </defs>
              <path d="M32 0C14.3 0 0 14.3 0 32c0 24 32 48 32 48s32-24 32-48C64 14.3 49.7 0 32 0z" fill="url(#pinGrad)" />
              <circle cx="32" cy="30" r="14" fill="white" />
              <circle cx="32" cy="30" r="8" fill="url(#pinGrad)" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold" style={{ color: "hsl(213, 83%, 56%)" }}>Rotasmart</span>
            <span className="text-2xl font-light text-[hsl(218,11%,46%)]">Motorista</span>
          </div>
          <p className="text-sm text-[hsl(218,11%,46%)] leading-relaxed">
            Acesse sua conta ou crie um novo cadastro<br />para iniciar a navegação.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-6 flex flex-col gap-4"
          style={{
            background: "hsl(0 0% 100% / 0.75)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px hsl(213 83% 56% / 0.1), 0 2px 8px hsl(0 0% 0% / 0.04)",
          }}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
            <TabsList className="grid grid-cols-2 rounded-2xl mb-4 bg-[hsl(220,14%,94%)] p-1 h-auto">
              <TabsTrigger
                value="login"
                className="rounded-xl py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[hsl(213,83%,56%)] data-[state=active]:border data-[state=active]:border-[hsl(213,83%,56%/0.3)]"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-xl py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[hsl(213,83%,56%)] data-[state=active]:border data-[state=active]:border-[hsl(213,83%,56%/0.3)]"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="seu@email.com" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showLoginPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className={`${inputClass} pr-10`} {...field} />
                          <button type="button" className="absolute inset-y-0 right-3 flex items-center text-[hsl(218,11%,46%)]" onClick={() => setShowLoginPassword(p => !p)}>
                            {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end">
                    <button type="button" onClick={() => navigate("/reset-password")} className="text-xs font-medium text-[hsl(213,83%,56%)] hover:underline">
                      Esqueceu sua senha?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-base tracking-wide disabled:opacity-50 transition-all"
                    style={{
                      background: "linear-gradient(135deg, hsl(213, 83%, 56%) 0%, hsl(213, 70%, 50%) 100%)",
                      boxShadow: "0 6px 20px hsl(213 83% 56% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
                    }}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="space-y-3">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
                  <FormField control={registerForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">Nome</FormLabel>
                      <FormControl>
                        <Input type="text" autoComplete="name" placeholder="Seu nome completo" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="seu@email.com" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">Telefone</FormLabel>
                      <FormControl>
                        <Input type="tel" autoComplete="tel" placeholder="(00) 00000-0000" className={inputClass} value={field.value} onChange={(e) => field.onChange(formatPhone(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="cpf" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">CPF</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" className={inputClass} value={field.value} onChange={(e) => field.onChange(formatCpf(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showRegisterPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" className={`${inputClass} pr-10`} {...field} />
                          <button type="button" className="absolute inset-y-0 right-3 flex items-center text-[hsl(218,11%,46%)]" onClick={() => setShowRegisterPassword(p => !p)}>
                            {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground">Confirmar senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showRegisterConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" className={`${inputClass} pr-10`} {...field} />
                          <button type="button" className="absolute inset-y-0 right-3 flex items-center text-[hsl(218,11%,46%)]" onClick={() => setShowRegisterConfirmPassword(p => !p)}>
                            {showRegisterConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-base tracking-wide disabled:opacity-50 transition-all"
                    style={{
                      background: "linear-gradient(135deg, hsl(213, 83%, 56%) 0%, hsl(213, 70%, 50%) 100%)",
                      boxShadow: "0 6px 20px hsl(213 83% 56% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)",
                    }}
                  >
                    {loading ? "Cadastrando..." : "Criar conta"}
                  </button>
                  <p className="text-xs text-[hsl(218,11%,46%)] text-center">Ao criar uma conta, você concorda com os termos de uso da RotaSmart.</p>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
