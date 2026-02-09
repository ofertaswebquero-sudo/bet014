import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string;
  order: "asc" | "desc" | null;
  onSort: (key: string) => void;
  className?: string;
  align?: "left" | "right" | "center";
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  order,
  onSort,
  className,
  align = "left",
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey && order !== null;

  return (
    <TableHead
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors group select-none",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className={cn(
        "flex items-center gap-1",
        align === "right" && "justify-end",
        align === "center" && "justify-center"
      )}>
        {label}
        <span className="inline-flex">
          {!isActive && <ArrowUpDown className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60" />}
          {isActive && order === "asc" && <ArrowUp className="h-3 w-3 text-primary" />}
          {isActive && order === "desc" && <ArrowDown className="h-3 w-3 text-primary" />}
        </span>
      </div>
    </TableHead>
  );
}
