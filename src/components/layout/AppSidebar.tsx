import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CalendarDays,
  Trophy,
  Shuffle,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  BookOpen,
  Landmark,
  Target,
  BarChart3,
  Terminal,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";

const menuGroups = [
  {
    title: "📊 Visão Geral",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: BarChart3, label: "Gestão Estratégica", path: "/gestao" },
    ],
  },
  {
    title: "💸 Financeiro",
    items: [
      { icon: Landmark, label: "Banca", path: "/banca" },
      { icon: Wallet, label: "Caixa Geral", path: "/caixa" },
      { icon: ArrowLeftRight, label: "Saques & Aportes", path: "/saques-aportes" },
      { icon: FileSpreadsheet, label: "Fechamento", path: "/fechamento" },
    ],
  },
  {
    title: "🎯 Operacional",
    items: [
      { icon: Trophy, label: "Apostas", path: "/apostas" },
      { icon: CalendarDays, label: "Diário Operações", path: "/diario" },
      { icon: Shuffle, label: "Surebets", path: "/surebets" },
      { icon: Target, label: "Cassino", path: "/cassino" },
    ],
  },
  {
    title: "⚙️ Configurações",
    items: [
      { icon: Building2, label: "Casas", path: "/casas" },
      { icon: Database, label: "Central de Dados", path: "/dados" },
      { icon: BookOpen, label: "Documentação", path: "/docs" },
      { icon: Terminal, label: "Logs do Sistema", path: "/logs" },
      { icon: Settings, label: "Configurações", path: "/configuracoes" },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(menuGroups.map(g => g.title));
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-20 items-center justify-between px-4 border-b border-sidebar-border/50">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-sidebar-foreground leading-none">
                BetBalance
              </span>
              <span className="text-[10px] font-medium text-primary uppercase tracking-widest mt-1">
                Boss Edition
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary mx-auto shadow-lg shadow-primary/20">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed ? (
              <Collapsible
                open={openGroups.includes(group.title)}
                onOpenChange={() => toggleGroup(group.title)}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40 hover:text-primary transition-colors">
                  <span>{group.title}</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", !openGroups.includes(group.title) && "-rotate-90")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-primary"
                        )} />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="space-y-2">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Tooltip key={item.path} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.path}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 mx-auto",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto border-t border-sidebar-border/50 p-4 space-y-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all",
            collapsed && "justify-center px-0"
          )}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-400" />}
          {!collapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
