"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function MonthPicker({
  currentMonth,
  allowAll = false,
}: {
  currentMonth: string;        // "YYYY-MM" or "all"
  allowAll?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAll = currentMonth === "all";
  const now = new Date();
  const [year, month] = isAll
    ? [now.getFullYear(), now.getMonth() + 1]
    : currentMonth.split("-").map(Number);

  function navigate(offset: number) {
    const d = new Date(year, month - 1 + offset, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", ym);
    router.push(`?${params.toString()}`);
  }

  function toggleAll() {
    const params = new URLSearchParams(searchParams.toString());
    if (isAll) {
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      params.set("month", ym);
    } else {
      params.set("month", "all");
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-2">
      {!isAll && (
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      <span className={`text-sm font-medium flex-1 text-center ${isAll ? "col-span-full" : ""}`}>
        {isAll ? "Todos los meses" : `${MONTHS[month - 1]} ${year}`}
      </span>
      {!isAll && (
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      {allowAll && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-2" onClick={toggleAll}>
          {isAll ? "Por mes" : "Ver todo"}
        </Button>
      )}
    </div>
  );
}
