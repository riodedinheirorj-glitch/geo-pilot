import { useState } from "react";
import { Eye, EyeOff, MapPin, Mail, Lock, User, Phone, CreditCard } from "lucide-react";
import rotasmartLogo from "@/assets/rotasmart-logo.png";

type Tab = "login" | "register";

interface LoginScreenProps {
  onLogin: () => void;
}

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const BackgroundPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.04]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="routes" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="3" fill="hsl(213, 83%, 56%)" />
        <circle cx="100" cy="60" r="2.5" fill="hsl(213, 83%, 56%)" />
        <circle cx="180" cy="30" r="2" fill="hsl(260, 100%, 69%)" />
        <circle cx="60" cy="140" r="3" fill="hsl(260, 100%, 69%)" />
        <circle cx="150" cy="160" r="2.5" fill="hsl(213, 83%, 56%)" />
        <circle cx="40" cy="80" r="1.5" fill="hsl(213, 83%, 56%)" />
        <circle cx="170" cy="110" r="2" fill="hsl(260, 100%, 69%)" />
        <line x1="20" y1="20" x2="100" y2="60" stroke="hsl(213, 83%, 56%)" strokeWidth="1" />
        <line x1="100" y1="60" x2="180" y2="30" stroke="hsl(260, 100%, 69%)" strokeWidth="0.8" />
        <line x1="100" y1="60" x2="60" y2="140" stroke="hsl(213, 83%, 56%)" strokeWidth="0.8" />
        <line x1="60" y1="140" x2="150" y2="160" stroke="hsl(260, 100%, 69%)" strokeWidth="1" />
        <line x1="40" y1="80" x2="170" y2="110" stroke="hsl(213, 83%, 56%)" strokeWidth="0.6" />
        <line x1="170" y1="110" x2="150" y2="160" stroke="hsl(213, 83%, 56%)" strokeWidth="0.7" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#routes)" />
  </svg>
);

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Validation
  const errors: Record<string, string> = {};
  if (touched.email && email && !validateEmail(email))
    errors.email = "E-mail inválido";
  if (touched.email && !email) errors.email = "E-mail é obrigatório";
  if (touched.password && !password) errors.password = "Senha é obrigatória";
  if (tab === "register") {
    if (touched.name && !name) errors.name = "Nome é obrigatório";
    if (touched.phone && phone && phone.replace(/\D/g, "").length < 10)
      errors.phone = "Telefone incompleto";
    if (touched.cpf && cpf && cpf.replace(/\D/g, "").length < 11)
      errors.cpf = "CPF incompleto";
    if (touched.cpf && !cpf) errors.cpf = "CPF é obrigatório";
  }

  const isLoginDisabled = !email || !password;
  const isRegisterDisabled =
    !email || !password || !name || !cpf || !phone;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all as touched
    const fields =
      tab === "login"
        ? ["email", "password"]
        : ["name", "phone", "cpf", "email", "password"];
    const allTouched = fields.reduce(
      (acc, f) => ({ ...acc, [f]: true }),
      {}
    );
    setTouched(allTouched);

    if (tab === "login" && !isLoginDisabled && !errors.email) {
      onLogin();
    }
    if (tab === "register" && !isRegisterDisabled && Object.keys(errors).length === 0) {
      onLogin();
    }
  };

  const inputClasses = (field: string) =>
    `w-full h-12 pl-11 pr-4 rounded-2xl border bg-white text-sm text-[hsl(217,47%,11%)] placeholder:text-[hsl(218,11%,65%)] outline-none transition-all duration-200 ${
      errors[field]
        ? "border-[hsl(0,84%,60%)] focus:ring-2 focus:ring-[hsl(0,84%,60%,0.2)]"
        : "border-[hsl(220,13%,90%)] focus:border-[hsl(213,83%,56%)] focus:ring-2 focus:ring-[hsl(213,83%,56%,0.15)]"
    }`;

  const passwordInputClasses = (field: string) =>
    `w-full h-12 pl-11 pr-12 rounded-2xl border bg-white text-sm text-[hsl(217,47%,11%)] placeholder:text-[hsl(218,11%,65%)] outline-none transition-all duration-200 ${
      errors[field]
        ? "border-[hsl(0,84%,60%)] focus:ring-2 focus:ring-[hsl(0,84%,60%,0.2)]"
        : "border-[hsl(220,13%,90%)] focus:border-[hsl(213,83%,56%)] focus:ring-2 focus:ring-[hsl(213,83%,56%,0.15)]"
    }`;

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen px-5 py-10 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #EBF2FC 50%, #DBEAFE 100%)",
      }}
    >
      <BackgroundPattern />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[420px]">
        {/* Logo + Title */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={rotasmartLogo}
            alt="Rotasmart Logo"
            className="w-11 h-11 rounded-xl shadow-sm"
          />
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold"
              style={{ color: "hsl(213, 60%, 25%)" }}
            >
              Rotasmart
            </span>
            <span
              className="text-2xl font-normal"
              style={{ color: "hsl(213, 83%, 56%)" }}
            >
              Motorista
            </span>
          </div>
        </div>

        {/* Description */}
        <p
          className="text-sm text-center mb-8 max-w-[320px] leading-relaxed"
          style={{ color: "hsl(218, 11%, 50%)" }}
        >
          Acesse sua conta ou crie um novo cadastro para iniciar a navegação.
        </p>

        {/* Card */}
        <div
          className="w-full rounded-[20px] p-6 sm:p-8"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 8px 40px rgba(47, 128, 237, 0.08), 0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Tabs */}
          <div
            className="flex rounded-2xl p-1 mb-7"
            style={{ background: "hsl(220, 14%, 95%)" }}
          >
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setTouched({});
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  tab === t
                    ? "bg-white text-[hsl(213,83%,56%)] shadow-sm"
                    : "text-[hsl(218,11%,50%)] hover:text-[hsl(218,11%,35%)]"
                }`}
              >
                {t === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <>
                {/* Nome */}
                <div>
                  <label className="block text-xs font-medium text-[hsl(218,11%,40%)] mb-1.5 ml-1">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(218,11%,65%)]"
                    />
                    <input
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => markTouched("name")}
                      className={inputClasses("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-[hsl(0,84%,60%)] mt-1 ml-1">{errors.name}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-medium text-[hsl(218,11%,40%)] mb-1.5 ml-1">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(218,11%,65%)]"
                    />
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      onBlur={() => markTouched("phone")}
                      maxLength={16}
                      className={inputClasses("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-[hsl(0,84%,60%)] mt-1 ml-1">{errors.phone}</p>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-medium text-[hsl(218,11%,40%)] mb-1.5 ml-1">
                    CPF
                  </label>
                  <div className="relative">
                    <CreditCard
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(218,11%,65%)]"
                    />
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      onBlur={() => markTouched("cpf")}
                      maxLength={14}
                      className={inputClasses("cpf")}
                    />
                  </div>
                  {errors.cpf && (
                    <p className="text-xs text-[hsl(0,84%,60%)] mt-1 ml-1">{errors.cpf}</p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[hsl(218,11%,40%)] mb-1.5 ml-1">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(218,11%,65%)]"
                />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched("email")}
                  className={inputClasses("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[hsl(0,84%,60%)] mt-1 ml-1">{errors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-medium text-[hsl(218,11%,40%)] mb-1.5 ml-1">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(218,11%,65%)]"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  className={passwordInputClasses("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(218,11%,65%)] hover:text-[hsl(213,83%,56%)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[hsl(0,84%,60%)] mt-1 ml-1">{errors.password}</p>
              )}
              {tab === "login" && (
                <div className="text-right mt-2">
                  <button
                    type="button"
                    className="text-xs font-medium hover:underline transition-all"
                    style={{ color: "hsl(213, 83%, 56%)" }}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={tab === "login" ? isLoginDisabled : isRegisterDisabled}
              className="w-full h-12 rounded-2xl text-white font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 mt-2"
              style={{
                background:
                  (tab === "login" ? isLoginDisabled : isRegisterDisabled)
                    ? "hsl(213, 40%, 75%)"
                    : "linear-gradient(135deg, hsl(213, 83%, 56%) 0%, hsl(225, 90%, 55%) 100%)",
                boxShadow:
                  (tab === "login" ? isLoginDisabled : isRegisterDisabled)
                    ? "none"
                    : "0 4px 20px rgba(47, 128, 237, 0.35)",
              }}
            >
              {tab === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          className="text-xs mt-6 text-center"
          style={{ color: "hsl(218, 11%, 60%)" }}
        >
          © 2026 Rotasmart · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
