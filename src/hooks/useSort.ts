import { useState, useMemo } from "react";

export type SortOrder = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  order: SortOrder;
}

export function useSort<T>(data: T[], initialKey?: string, initialOrder: SortOrder = "desc") {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: initialKey || "",
    order: initialOrder,
  });

  const handleSort = (key: string) => {
    let order: SortOrder = "asc";
    if (sortConfig.key === key && sortConfig.order === "asc") {
      order = "desc";
    } else if (sortConfig.key === key && sortConfig.order === "desc") {
      order = null;
    }
    setSortConfig({ key, order });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.order) {
      return data;
    }

    return [...data].sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const result = aValue < bValue ? -1 : 1;
      return sortConfig.order === "asc" ? result : -result;
    });
  }, [data, sortConfig]);

  return { sortedData, sortConfig, handleSort };
}
