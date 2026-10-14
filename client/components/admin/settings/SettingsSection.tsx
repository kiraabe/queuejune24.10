import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface SettingsSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}

export function SettingsSection({
  icon: Icon,
  title,
  description,
  className,
  children,
}: SettingsSectionProps) {
  return (
    <section
      className={`flex flex-col rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className ?? ""}`}
    >
      <header className="flex items-start gap-3 border-b border-border px-6 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="divide-y divide-border px-6">{children}</div>
    </section>
  );
}

interface SettingRowProps {
  htmlFor?: string;
  label: string;
  description: string;
  children: ReactNode;
}

export function SettingRow({
  htmlFor,
  label,
  description,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="w-full shrink-0 sm:w-60">{children}</div>
    </div>
  );
}
