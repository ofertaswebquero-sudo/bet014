import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DataSourceInfo, KPI_EXPLANATIONS } from "./DataSourceInfo";

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: "default" | "success" | "destructive" | "warning";
  subtitle?: string;
  tooltipKey?: keyof typeof KPI_EXPLANATIONS;
}

export function KPICard({ title, value, icon, variant = "default", subtitle, tooltipKey }: KPICardProps) {
  const variantClasses = {
    default: "bg-card",
    success: "bg-success/10",
    destructive: "bg-destructive/10",
    warning: "bg-warning/10",
  };

  const valueClasses = {
    default: "",
    success: "text-success",
    destructive: "text-destructive",
    warning: "text-warning",
  };

  const tooltip = tooltipKey ? KPI_EXPLANATIONS[tooltipKey] : null;

  return (
    <div className={cn("rounded-lg border p-4", variantClasses[variant])}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm text-muted-foreground">{title}</p>
        {tooltip && (
          <DataSourceInfo
            title={tooltip.title}
            formula={tooltip.formula}
            sources={tooltip.sources}
            example={tooltip.example}
          />
        )}
      </div>
      <p className={cn("text-2xl font-bold", valueClasses[variant])}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

interface KPISummaryProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export function KPISummary({ children, columns = 4 }: KPISummaryProps) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
    5: "sm:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {children}
    </div>
  );
}
