export type SortDir = "asc" | "desc";

export interface TableState {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDir: SortDir;
  filter: string;
}

export const DEFAULT_TABLE_STATE: TableState = {
  page: 1,
  pageSize: 10,
  sortKey: "",
  sortDir: "asc",
  filter: "",
};

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
    pageSize,
  };
}

export function sortRows<T>(items: T[], sortKey: string, sortDir: SortDir): T[] {
  if (!sortKey) return items;
  return [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortKey];
    const bv = (b as Record<string, unknown>)[sortKey];
    const aStr = av == null ? "" : String(av).toLowerCase();
    const bStr = bv == null ? "" : String(bv).toLowerCase();
    if (aStr < bStr) return sortDir === "asc" ? -1 : 1;
    if (aStr > bStr) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

export function filterRows<T>(items: T[], filter: string, keys: (keyof T)[]): T[] {
  const q = filter.trim().toLowerCase();
  if (!q) return items;
  return items.filter((row) =>
    keys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
  );
}
