"use client";

import { icons } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/dynamic-icon";

const ALL_ICON_NAMES = Object.keys(icons);
const PAGE_SIZE = 20;

function toKebab(pascal: string): string {
  return pascal
    .replace(/([A-Z])/g, (_, c, i) => (i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`));
}

interface IconPickerProps {
  value: string | null;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_ICON_NAMES;
    const q = search.toLowerCase();
    return ALL_ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar ícono..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        className="h-8 text-sm"
      />
      <div className="grid grid-cols-5 gap-1">
        {pageItems.map((name) => {
          const kebab = toKebab(name);
          const isSelected = value === kebab;
          return (
            <button
              key={name}
              type="button"
              title={kebab}
              onClick={() => onChange(kebab)}
              className={`flex items-center justify-center w-10 h-10 rounded transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground ring-1 ring-primary"
                  : "hover:bg-accent"
              }`}
            >
              <DynamicIcon name={kebab} size={18} />
            </button>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span>{page + 1} / {totalPages}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
