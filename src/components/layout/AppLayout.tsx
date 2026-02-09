import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useLocation } from "react-router-dom";
import { PageExplanationButton } from "@/components/shared/PageExplanation";
import { StakeCalculator } from "@/components/shared/StakeCalculator";
import { useCasas } from "@/hooks/useSupabaseData";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

// Páginas onde a calculadora de stake deve aparecer
const STAKE_CALCULATOR_ROUTES = ['/apostas', '/surebets', '/cassino'];

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const location = useLocation();
  const { data: casas } = useCasas();
  
  // Calcular banca total das casas
  const bancaTotal = casas?.reduce((acc, c) => acc + (c.saldo_real || 0), 0) || 0;
  
  // Mostrar calculadora apenas em páginas de apostas
  const showStakeCalculator = STAKE_CALCULATOR_ROUTES.includes(location.pathname);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden ml-20 lg:ml-72 transition-all duration-300">
        <div className="h-full flex flex-col">
          {/* Header Area */}
          <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
              {title ? (
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
              ) : (
                <div />
              )}
              
              <div className="flex items-center gap-4">
                <PageExplanationButton routePath={location.pathname} />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 container mx-auto max-w-7xl p-6 animate-fade-in">
            {children}
          </div>
          
          {/* Footer Space */}
          <footer className="py-6 text-center text-xs text-muted-foreground/50">
            BetBalance Boss &copy; {new Date().getFullYear()} - Gestão Profissional de Banca
          </footer>
        </div>
      </main>
      
      <Toaster />
      <Sonner />
      {showStakeCalculator && <StakeCalculator bancaTotal={bancaTotal} />}
    </div>
  );
}
