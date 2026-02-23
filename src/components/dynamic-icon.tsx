"use client";

import { icons, type LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name: string | null;
  fallback?: React.ReactNode;
}

function toKey(kebab: string): string {
  return kebab
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function DynamicIcon({ name, fallback, ...props }: DynamicIconProps) {
  if (!name) return <>{fallback ?? null}</>;
  const Icon = icons[toKey(name) as keyof typeof icons];
  if (!Icon) return <>{fallback ?? <span>{name}</span>}</>;
  return <Icon {...props} />;
}
