import { LayoutDashboard, Map, FileUp, User } from "lucide-react";

interface BottomNavProps {
  current: string;
  onNavigate: (screen: string) => void;
}

const tabs = [
  { id: "dashboard", label: "Início", icon: LayoutDashboard },
  { id: "route", label: "Rota", icon: Map },
  { id: "import", label: "Importar", icon: FileUp },
  { id: "profile", label: "Perfil", icon: User },
];

const BottomNav = ({ current, onNavigate }: BottomNavProps) => {
  return (
    <div
      className="flex items-center justify-around px-2 py-3 bg-card border-t border-border"
      style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: active ? "hsl(var(--primary) / 0.12)" : "transparent",
              }}
            >
              <Icon
                size={18}
                style={{
                  color: active
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground))",
                }}
              />
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{
                color: active
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;