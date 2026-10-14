import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toneDanger, toneSuccess, toneWarning } from "./status-tones";

export type PerformanceLevel =
  | "on_time"
  | "slightly_over"
  | "moderately_over"
  | "significantly_over";

const LEVEL_TONE: Record<PerformanceLevel, string> = {
  on_time: toneSuccess,
  slightly_over: toneWarning,
  moderately_over: toneWarning,
  significantly_over: toneDanger,
};

const LEVEL_ICON: Record<PerformanceLevel, LucideIcon> = {
  on_time: CheckCircle,
  slightly_over: AlertTriangle,
  moderately_over: AlertTriangle,
  significantly_over: X,
};

const LEVEL_TEXT: Record<PerformanceLevel, string> = {
  on_time: "text-emerald-700 dark:text-emerald-400",
  slightly_over: "text-amber-800 dark:text-amber-300",
  moderately_over: "text-amber-800 dark:text-amber-300",
  significantly_over: "text-red-700 dark:text-red-400",
};

const LEVEL_SOLID: Record<PerformanceLevel, string> = {
  on_time: "bg-emerald-600 text-white",
  slightly_over: "bg-amber-600 text-white",
  moderately_over: "bg-amber-600 text-white",
  significantly_over: "bg-red-600 text-white",
};

const LEVEL_ARROW_COLOR: Record<PerformanceLevel, string> = {
  on_time: "rgb(5, 150, 105)",
  slightly_over: "rgb(217, 119, 6)",
  moderately_over: "rgb(217, 119, 6)",
  significantly_over: "rgb(220, 38, 38)",
};

const LEVEL_LABEL: Record<PerformanceLevel, string> = {
  on_time: "On Time",
  slightly_over: "Slightly Over",
  moderately_over: "Moderately Over",
  significantly_over: "Significantly Over",
};

const LEVEL_DESCRIPTION: Record<PerformanceLevel, string> = {
  on_time: "On Time - Good performance (≥ 65%)",
  slightly_over: "Slightly Over - Minor delay (50-64%)",
  moderately_over: "Moderately Over - Significant delay (30-49%)",
  significantly_over: "Significantly Over - Major delay (< 30%)",
};

const formatSeconds = (seconds: number | null) => {
  if (seconds === null || seconds === 0) return "N/A";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}hr ${minutes}min ${secs}sec`;
  } else if (minutes > 0) {
    return `${minutes}min ${secs}sec`;
  } else {
    return `${secs}sec`;
  }
};

const getStatusText = (
  level: PerformanceLevel,
  timeDiffSeconds: number,
  overTime: number,
) => {
  if (level === "on_time") {
    return timeDiffSeconds <= 0
      ? "Within standard time"
      : `Slightly over by ${formatSeconds(overTime)}`;
  }
  if (level === "significantly_over") {
    return `Significantly over by ${formatSeconds(overTime)}`;
  }
  return `Over by ${formatSeconds(overTime)}`;
};

interface PerformanceRatingProps {
  performanceLevel: PerformanceLevel;
  standardMinutes: number | null;
  standardSeconds: number;
  source: "category" | "services" | null;
  selectedServices: string[];
  serviceStandardTimes: Record<string, number>;
  totalDuration: number;
}

export function PerformanceRating({
  performanceLevel,
  standardMinutes,
  standardSeconds,
  source,
  selectedServices,
  serviceStandardTimes,
  totalDuration,
}: PerformanceRatingProps) {
  // Formula: (standard_time / actual_time) * 65, clamped to [0, 100]
  const percentageOfStandard = Math.round(
    Math.max(0, Math.min(100, (standardSeconds / totalDuration) * 65)),
  );
  const timeDiffSeconds = totalDuration - standardSeconds;
  const overTime = Math.max(0, timeDiffSeconds);
  const statusText = getStatusText(performanceLevel, timeDiffSeconds, overTime);
  const Icon = LEVEL_ICON[performanceLevel];
  const label = LEVEL_LABEL[performanceLevel];

  return (
    <div
      className={`mt-4 space-y-4 rounded-lg border p-4 ${LEVEL_TONE[performanceLevel]}`}
    >
      {source === "services" && selectedServices.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">
            Selected Services Standard Time:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedServices.map((serviceName) => {
              const serviceTime = serviceStandardTimes[serviceName];
              return (
                <div
                  key={serviceName}
                  className="flex items-center justify-between rounded-md bg-background/60 p-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {serviceName}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {serviceTime ? `${serviceTime} min` : "N/A"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="my-2 border-t border-current/20" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-muted-foreground">
          Total Standard Time: {standardMinutes} minutes (
          {formatSeconds(standardSeconds)})
          {source === "services" && (
            <span className="ml-2 text-xs font-normal opacity-75">
              (combined from selected services)
            </span>
          )}
          {source === "category" && (
            <span className="ml-2 text-xs font-normal opacity-75">
              (from service category)
            </span>
          )}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              tabIndex={0}
              className={`inline-flex cursor-help items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${LEVEL_TONE[performanceLevel]}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            {LEVEL_DESCRIPTION[performanceLevel]}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div
            className="group relative h-4 flex-1 cursor-help overflow-visible rounded-full"
            title={`${label}: ${percentageOfStandard}% | Actual: ${formatSeconds(totalDuration)} | Standard: ${formatSeconds(standardSeconds)}`}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, rgb(239, 68, 68) 0%, rgb(239, 68, 68) 29%, rgb(251, 146, 60) 29%, rgb(251, 146, 60) 49%, rgb(251, 191, 36) 49%, rgb(251, 191, 36) 64%, rgb(34, 197, 94) 64%, rgb(34, 197, 94) 100%)",
                width: "100%",
              }}
            ></div>

            <div
              className="absolute -top-10 z-10 flex flex-col items-center cursor-help"
              style={{ left: `calc(${percentageOfStandard}% - 20px)` }}
            >
              <div className="relative">
                <div
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold ${LEVEL_SOLID[performanceLevel]}`}
                >
                  {percentageOfStandard}%
                </div>
                <div
                  className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-0.5"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `8px solid ${LEVEL_ARROW_COLOR[performanceLevel]}`,
                  }}
                ></div>
              </div>
            </div>

            {percentageOfStandard < 100 && (
              <div
                className="absolute bottom-0 top-0 w-0.5 bg-background opacity-70 transition-all"
                style={{ left: "100%" }}
              ></div>
            )}

            <div className="pointer-events-none absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-3 py-2 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1 font-semibold">
                <Icon className="h-3 w-3" aria-hidden="true" />
                {label}
              </div>
              <div className="mt-1 opacity-90">
                {percentageOfStandard}% of standard
              </div>
              <div className="opacity-90">
                Actual: {formatSeconds(totalDuration)}
              </div>
              <div className="opacity-90">
                Standard: {formatSeconds(standardSeconds)}
              </div>
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground"></div>
            </div>
          </div>
          <span
            className="min-w-fit whitespace-nowrap text-sm font-semibold"
            title={`Total: ${percentageOfStandard}%`}
          >
            {percentageOfStandard}%
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        <span
          className={`flex items-center gap-1 font-semibold ${LEVEL_TEXT[performanceLevel]}`}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {statusText}
        </span>
      </p>
    </div>
  );
}
