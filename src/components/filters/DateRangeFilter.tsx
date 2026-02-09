import { useState, useCallback } from "react";
import { Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (preset: string) => {
    const hoje = new Date();
    let inicio = new Date();

    switch (preset) {
      case "7d":
        inicio.setDate(hoje.getDate() - 7);
        break;
      case "30d":
        inicio.setDate(hoje.getDate() - 30);
        break;
      case "90d":
        inicio.setDate(hoje.getDate() - 90);
        break;
      case "mes":
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case "ano":
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
      case "all":
        onClear();
        setIsOpen(false);
        return;
    }

    onStartDateChange(inicio.toISOString().split("T")[0]);
    onEndDateChange(hoje.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const hasFilter = startDate || endDate;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={hasFilter ? "default" : "outline"} size="sm" className="h-9 gap-2">
          <Calendar className="h-4 w-4" />
          {hasFilter ? (
            <span className="text-xs">
              {startDate ? new Date(startDate).toLocaleDateString("pt-BR") : "..."} -{" "}
              {endDate ? new Date(endDate).toLocaleDateString("pt-BR") : "..."}
            </span>
          ) : (
            <span>Período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Atalhos</Label>
            <div className="flex flex-wrap gap-1">
              <Button variant="outline" size="sm" onClick={() => handlePreset("7d")}>
                7 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset("30d")}>
                30 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset("90d")}>
                90 dias
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset("mes")}>
                Mês atual
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset("ano")}>
                Ano atual
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePreset("all")}>
                Todos
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Data inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          {hasFilter && (
            <Button variant="ghost" size="sm" className="w-full" onClick={onClear}>
              Limpar filtro
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SelectFilterProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function SelectFilter({ label, value, options, onValueChange, placeholder = "Todos" }: SelectFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 w-[150px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function useDateRangeFilter() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filterByDate = useCallback(<T extends { data: string }>(items: T[] | undefined): T[] => {
    if (!items) return [];
    return items.filter((item) => {
      if (startDate && item.data < startDate) return false;
      if (endDate && item.data > endDate) return false;
      return true;
    });
  }, [startDate, endDate]);

  const clearFilter = useCallback(() => {
    setStartDate("");
    setEndDate("");
  }, []);

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    filterByDate,
    clearFilter,
    hasFilter: startDate || endDate,
  };
}
