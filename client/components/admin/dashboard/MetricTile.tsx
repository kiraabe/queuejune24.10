import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  hint: string;
  icon: LucideIcon;
  tooltipTitle: string;
  tooltipDescription: string;
}

export default function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tooltipTitle,
  tooltipDescription,
}: MetricTileProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 md:p-6 cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          </div>
          <p className="truncate text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p className="font-semibold">{tooltipTitle}</p>
          <p className="text-xs">{tooltipDescription}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
