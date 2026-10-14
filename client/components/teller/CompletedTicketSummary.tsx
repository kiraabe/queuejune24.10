import type { Ticket } from "@shared/api";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Activity, CheckCircle2 } from "lucide-react";
import { toneSuccess, toneWarning } from "./status-tones";

interface EmployeeStep {
  id: string;
  employeeName: string;
  jobTitle: string;
  status: "Started" | "Proceeded" | "Completed" | "Retrieved";
  startedAt?: number | null;
  endedAt?: number | null;
  durationSeconds: number | null;
  windowId?: number | null;
  isTeller?: boolean;
  isArchiver?: boolean;
}

interface CompletedTicketSummaryProps {
  ticket: Ticket;
}

interface CaseWorkflowResponse {
  items?: EmployeeStep[];
}

export function CompletedTicketSummary({
  ticket,
}: CompletedTicketSummaryProps) {
  const {
    data: performanceData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["case-workflow-summary", ticket.id],
    queryFn: async () => {
      const response = await apiFetch<CaseWorkflowResponse>(
        `/api/employee/case-workflow?ticketId=${encodeURIComponent(ticket.id)}`,
      );
      return response;
    },
    enabled: ticket.status === "done",
  });

  if (ticket.status !== "done") {
    return null;
  }

  if (isPending) {
    return (
      <div className="mt-3 rounded-md border border-border bg-muted/40 p-3">
        <p className="text-xs text-muted-foreground">Loading workflow...</p>
      </div>
    );
  }

  const items = performanceData?.items || [];

  if (!items || items.length === 0) {
    // Show a fallback message when there's no workflow data (e.g., direct completion)
    return (
      <div className={`mt-3 rounded-md border p-3 ${toneWarning}`}>
        <p className="flex items-center gap-1.5 text-xs font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Completed
        </p>
        {ticket.completedAt && (
          <p className="mt-1 text-xs opacity-80">
            {new Date(ticket.completedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes}m`;
    }
    const hours = Math.round(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (timestamp: number | null | undefined) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const totalDuration = items.reduce((sum, item) => {
    return sum + (item.durationSeconds || 0);
  }, 0);

  return (
    <div
      className={`mt-3 space-y-2 rounded-md border p-3 ${toneSuccess}`}
    >
      {/* Flow visualization */}
      <div className="space-y-2">
        {items.map((step, index) => (
          <div key={step.id}>
            <div className="flex items-center gap-2 rounded-md bg-background/70 p-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs font-semibold">
                    {step.employeeName}
                  </span>
                </div>
                {step.startedAt && (
                  <p className="ml-4 mt-0.5 text-xs text-muted-foreground">
                    <span className="opacity-70">↳</span>{" "}
                    {formatDateTime(step.startedAt)}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-semibold">
                {formatTime(step.durationSeconds)}
              </span>
            </div>
            {index < items.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-2 flex items-center gap-2 border-t border-current/20 pt-2">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs font-medium">
          {items.length} employee{items.length !== 1 ? "s" : ""} • Total:{" "}
          <span className="font-semibold">{formatTime(totalDuration)}</span>
        </span>
      </div>
    </div>
  );
}
