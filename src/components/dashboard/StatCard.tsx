import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: ReactNode;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'primary';
  className?: string;
  isHero?: boolean;
}

const variantStyles = {
  default: 'bg-card border-border/50 hover:border-primary/30',
  primary: 'bg-primary/5 border-primary/20 hover:bg-primary/10',
  success: 'bg-success/5 border-success/20 hover:bg-success/10',
  danger: 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10',
  warning: 'bg-accent/5 border-accent/20 hover:bg-accent/10',
  info: 'bg-info/5 border-info/20 hover:bg-info/10',
};

const iconStyles = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  danger: 'bg-destructive/20 text-destructive',
  warning: 'bg-accent/20 text-accent',
  info: 'bg-info/20 text-info',
};

const trendColors = {
  up: 'text-success bg-success/10',
  down: 'text-destructive bg-destructive/10',
  neutral: 'text-muted-foreground bg-muted',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  className,
  isHero = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in",
        isHero ? "p-3" : "p-2",
        variantStyles[variant],
        className
      )}
    >
      {/* Background Glow Effect */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={cn(
              "font-bold tracking-tight text-foreground",
              isHero ? "text-xl" : "text-lg"
            )}>{value}</h3>
          </div>
          {subtitle && (
            <p className="text-[10px] font-medium text-muted-foreground/60">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            isHero ? "h-7 w-7" : "h-6 w-6",
            iconStyles[variant === 'default' ? 'default' : variant]
          )}>
            {/* Clone element to adjust icon size if it's a lucide icon */}
            {typeof icon === 'object' ? (
              <div className={isHero ? "[&>svg]:h-4 [&>svg]:w-4" : "[&>svg]:h-3.5 [&>svg]:w-3.5"}>
                {icon}
              </div>
            ) : icon}
          </div>
        )}
      </div>
      
      {trend && trendValue && (
        <div className="mt-2 flex items-center relative z-10">
          <div className={cn(
            "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            trendColors[trend]
          )}>
            {trend === 'up' && <span className="text-[8px]">▲</span>}
            {trend === 'down' && <span className="text-[8px]">▼</span>}
            <span>{trendValue}</span>
          </div>
          <span className="ml-1.5 text-[8px] font-medium text-muted-foreground/50 uppercase tracking-tighter">vs. anterior</span>
        </div>
      )}
    </div>
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
