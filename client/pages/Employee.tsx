import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, Package, ArrowRight, Pause } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { CaseActionDialog } from "@/components/employee/CaseActionDialog";
import { HoldCaseDialog } from "@/components/employee/HoldCaseDialog";
import type {
  Ticket,
  ListUsersResponse,
  ListJobTitlesResponse,
} from "@shared/api";

interface EmployeeStats {
  receivedToday: number;
  completedToday: number;
  proceedToday: number;
}

interface EmployeeTicketsResponse {
  items: Ticket[];
  total: number;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";

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
}

function calculateDuration(
  startTime: number | null | undefined,
  endTime: number | null | undefined,
): number | null {
  if (!startTime || !endTime) return null;
  return Math.round((endTime - startTime) / 1000);
}

const toneClasses = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  info: "border-primary/20 bg-primary/5 text-primary",
  neutral: "border-border bg-muted text-muted-foreground",
} as const;

type Tone = keyof typeof toneClasses;

interface TicketRowProps {
  ticket: Ticket;
  onComplete?: (ticketId: string) => void;
  onActionStart?: (ticketId: string, action: "start" | "proceed") => void;
}

interface CaseHistoryRowProps {
  ticket: Ticket;
  userMap?: Map<string, string>;
}

interface PerformanceMetric {
  id: string;
  ticketId: string;
  employeeId: string;
  employeeName: string;
  ticketCode: string;
  startedAt: number | null;
  endedAt: number | null;
  status: "in_progress" | "completed" | "proceeded";
  durationSeconds: number | null;
}

interface PerformanceMetricsResponse {
  items: PerformanceMetric[];
  sumEmployeesDurationSeconds?: number | null;
}

interface CaseHold {
  id: string;
  ticketId: string;
  heldByUserId: string;
  subject: string;
  description: string;
  heldAt: number;
  resumedAt?: number | null;
  holdDurationSeconds?: number | null;
}

const CaseHistoryRow = ({ ticket, userMap }: CaseHistoryRowProps) => {
  const [performanceDetails, setPerformanceDetails] = useState<
    PerformanceMetric[]
  >([]);
  const [holds, setHolds] = useState<CaseHold[]>([]);
  const [sumEmployeesDuration, setSumEmployeesDuration] = useState<
    number | null
  >(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Fetch performance metrics and hold records for this ticket
    apiFetch<PerformanceMetricsResponse>(
      `/api/employee/performance?ticketId=${ticket.id}`,
    )
      .then((data) => {
        setPerformanceDetails(data.items);
        setSumEmployeesDuration(data.sumEmployeesDurationSeconds ?? null);
      })
      .catch(() => {});

    // Fetch hold records
    apiFetch<{ holds: CaseHold[] }>(`/api/employee/holds?ticketId=${ticket.id}`)
      .then((data) => {
        setHolds(data.holds || []);
      })
      .catch(() => {});
  }, [ticket.id]);

  const isProceed = ticket.proceededAt != null;
  const isComplete = ticket.completedAt != null;
  const hasActiveHold = holds.some((h) => h.resumedAt == null);

  // For completed cases, show total duration from creation to completion (initiation to final)
  // For proceeded cases, show duration to the point it was forwarded
  // For in-progress cases, show duration to the latest proceed time
  const totalDuration = calculateDuration(
    ticket.createdAt,
    isComplete ? ticket.completedAt : ticket.proceededAt || ticket.completedAt,
  );
  const status = isComplete
    ? "Completed"
    : hasActiveHold
      ? "On Hold"
      : isProceed
        ? "Forwarded"
        : "In Progress";
  const statusTone: Tone = isComplete
    ? "success"
    : hasActiveHold
      ? "warning"
      : isProceed
        ? "neutral"
        : "info";

  const toggleDetails = () => setShowDetails((open) => !open);

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={showDetails}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-lg border border-border p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={toggleDetails}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleDetails();
          }
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-display font-semibold text-foreground truncate">
              Ticket {ticket.code}
            </h3>
            <Badge
              className={cn("text-xs whitespace-nowrap", toneClasses[statusTone])}
              variant="outline"
            >
              {status}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="col-span-2 text-sm mb-1">
                <span className="font-medium">Customer:</span>{" "}
                <span className="text-foreground font-semibold">
                  {ticket.ownerName || "—"}
                </span>
              </div>
              <div>
                <span className="font-medium">Started:</span>{" "}
                {ticket.startedAt
                  ? new Date(ticket.startedAt).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "—"}
              </div>
              <div>
                <span className="font-medium">Ended:</span>{" "}
                {ticket.completedAt || ticket.proceededAt
                  ? new Date(
                      ticket.completedAt || ticket.proceededAt || 0,
                    ).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "—"}
              </div>
              <div>
                <span className="font-medium">Total Duration:</span>{" "}
                {formatDuration(totalDuration)}
              </div>
              {sumEmployeesDuration && (
                <div>
                  <span className="font-medium">Employees Total:</span>{" "}
                  {formatDuration(sumEmployeesDuration)}
                </div>
              )}
              {ticket.transferredToUserId && (
                <div>
                  <span className="font-medium">
                    {isProceed ? "Forwarded To:" : "Last Forwarded To:"}
                  </span>{" "}
                  {userMap?.get(ticket.transferredToUserId) ||
                    ticket.transferredToUserId}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Category:</span>{" "}
              {ticket.serviceCategory || "—"}
            </div>
            {Array.isArray(ticket.selectedServices) &&
              ticket.selectedServices.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Services:</span>{" "}
                  {ticket.selectedServices.join(", ")}
                </div>
              )}
            {(ticket.landCertificateKarta || ticket.landCertificateDigital) && (
              <div className="mt-2 pt-2 border-t border-border space-y-1">
                {ticket.landCertificateKarta && (
                  <div className="text-xs bg-primary/5 p-2 rounded-md">
                    <span className="font-medium text-primary">
                      Land Cert (ካርታ):
                    </span>{" "}
                    <span className="text-foreground">
                      {ticket.landCertificateKarta}
                    </span>
                  </div>
                )}
                {ticket.landCertificateDigital && (
                  <div className="text-xs bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-md">
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      Cert (ካርታ):
                    </span>{" "}
                    <span className="text-foreground">
                      {ticket.landCertificateDigital}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="flex flex-col items-end gap-2">
            <div>
              <div className="text-sm font-semibold text-foreground">
                {formatDuration(totalDuration)}
              </div>
              <p className="text-xs text-muted-foreground">
                {isComplete ? "Total case time" : "Elapsed"}
              </p>
            </div>
            {sumEmployeesDuration != null && (
              <div className="border-t border-border pt-2">
                <div className="text-sm font-semibold text-primary">
                  {formatDuration(sumEmployeesDuration)}
                </div>
                <p className="text-xs text-muted-foreground">Employees time</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {ticket.createdAt
              ? new Date(ticket.createdAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>

      {/* Performance Details - Workflow Chain */}
      {showDetails && (performanceDetails.length > 0 || holds.length > 0) && (
        <div className="ml-0 sm:ml-4 space-y-3 border-l-2 border-border pl-4">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Workflow Chain
          </p>
          {/* Hold Records */}
          {holds.map((hold) => {
            const holdDurationSeconds = hold.holdDurationSeconds || 0;
            const heldByUserName =
              userMap?.get(hold.heldByUserId) || hold.heldByUserId;

            return (
              <div
                key={hold.id}
                className={cn("rounded-lg border p-3 text-xs", toneClasses.warning)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        Case On Hold
                      </p>
                      <Badge variant="outline" className={cn("text-xs", toneClasses.warning)}>
                        Paused
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      <span className="font-medium">Held By:</span>{" "}
                      {heldByUserName}
                    </p>
                    <p className="text-muted-foreground mt-1 font-medium">
                      <span className="font-bold">Subject:</span> {hold.subject}
                    </p>
                    {hold.description && (
                      <p className="text-muted-foreground mt-1">
                        <span className="font-medium">Details:</span>{" "}
                        {hold.description}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1">
                      <span className="font-medium">Held at:</span>{" "}
                      {new Date(hold.heldAt).toLocaleTimeString()}
                    </p>
                    {hold.resumedAt && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Resumed at:</span>{" "}
                        {new Date(hold.resumedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatDuration(holdDurationSeconds)}
                    </p>
                    <p className="text-muted-foreground text-xs">on hold</p>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Employee Performance Details */}
          {performanceDetails.map((perf, index) => {
            const isFirst = index === 0;
            const isCompleted = perf.status === "completed";
            const nextPerf = performanceDetails[index + 1];

            const tone: Tone = isFirst
              ? "info"
              : isCompleted
                ? "success"
                : "neutral";

            return (
              <div key={perf.id} className="space-y-2">
                <div
                  className={cn("rounded-lg border p-3 text-xs", toneClasses[tone])}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {perf.employeeName}
                        </p>
                        {isFirst && (
                          <Badge variant="outline" className={cn("text-xs", toneClasses.info)}>
                            Initiated
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="outline" className={cn("text-xs", toneClasses.success)}>
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1">
                        <span className="font-medium">Started:</span>{" "}
                        {perf.startedAt
                          ? new Date(perf.startedAt).toLocaleTimeString()
                          : "—"}
                      </p>
                      {perf.endedAt && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Ended:</span>{" "}
                          {new Date(perf.endedAt).toLocaleTimeString()}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        <span className="font-medium">Status:</span>{" "}
                        {perf.status === "completed"
                          ? "Completed"
                          : perf.status === "proceeded"
                            ? "Forwarded"
                            : "In Progress"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatDuration(perf.durationSeconds)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        time spent
                      </p>
                    </div>
                  </div>
                </div>
                {perf.status === "proceeded" && nextPerf && (
                  <div className="flex items-center justify-center h-6">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-primary">
                        ↓
                      </span>
                      <span className="text-xs text-muted-foreground">to</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const useLiveElapsedSeconds = (
  serverSeconds: number | null,
  isRunning: boolean,
) => {
  const [anchor, setAnchor] = useState(() => ({
    seconds: serverSeconds,
    receivedAt: Date.now(),
  }));
  const [now, setNow] = useState(() => Date.now());

  if (anchor.seconds !== serverSeconds) {
    setAnchor({ seconds: serverSeconds, receivedAt: Date.now() });
  }

  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (anchor.seconds == null) return null;
  if (!isRunning) return anchor.seconds;
  return (
    anchor.seconds + Math.max(0, Math.floor((now - anchor.receivedAt) / 1000))
  );
};

const TicketRow = ({ ticket, onComplete, onActionStart }: TicketRowProps) => {
  const { t } = useTranslation();
  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [holds, setHolds] = useState<CaseHold[]>([]);
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number | null>(
    null,
  );

  // Debug logging
  useEffect(() => {
    console.log("TicketRow debug:", {
      ticketId: ticket.id,
      code: ticket.code,
      transferredToUserId: ticket.transferredToUserId,
      employeeStartedAt: ticket.employeeStartedAt,
      completedAt: ticket.completedAt,
      proceededAt: ticket.proceededAt,
    });
  }, [ticket]);

  // Fetch hold records to check for active holds
  const fetchHolds = async () => {
    try {
      const data = await apiFetch<{ holds: CaseHold[] }>(
        `/api/employee/holds?ticketId=${ticket.id}`,
      );
      setHolds(data.holds || []);
    } catch (error) {
      console.error("Failed to fetch holds:", error);
    }
  };

  useEffect(() => {
    fetchHolds();
  }, [ticket.id]);

  // Check if case currently has an active hold
  const hasActiveHold = holds.some((h) => h.resumedAt == null);

  // Calculate time remaining for active hold (72 hours = 259200 seconds)
  const HOLD_EXPIRATION_SECONDS = 72 * 60 * 60;
  useEffect(() => {
    if (!hasActiveHold) {
      setTimeUntilExpiration(null);
      return;
    }

    const activeHold = holds.find((h) => h.resumedAt == null);
    if (!activeHold) return;

    // Update countdown every second
    const interval = setInterval(() => {
      const now = Date.now();
      const heldAt = activeHold.heldAt;
      const expiresAt = heldAt + HOLD_EXPIRATION_SECONDS * 1000;
      const timeRemaining = Math.max(0, expiresAt - now);
      setTimeUntilExpiration(timeRemaining);
    }, 1000);

    // Initial calculation
    const now = Date.now();
    const expiresAt = activeHold.heldAt + HOLD_EXPIRATION_SECONDS * 1000;
    const timeRemaining = Math.max(0, expiresAt - now);
    setTimeUntilExpiration(timeRemaining);

    return () => clearInterval(interval);
  }, [hasActiveHold, holds]);

  // Format time remaining for display
  const formatTimeRemaining = (ms: number | null) => {
    if (ms === null || ms === 0) return null;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const isRunning =
    ticket.employeeStartedAt != null &&
    ticket.proceededAt == null &&
    ticket.completedAt == null &&
    !hasActiveHold;
  const duration = useLiveElapsedSeconds(
    ticket.employeeActiveDurationSeconds ?? null,
    isRunning,
  );

  const statusTone: Tone =
    ticket.status === "done"
      ? "success"
      : hasActiveHold || ticket.status === "on_hold"
        ? "warning"
        : "info";

  const handleStart = async () => {
    try {
      await apiFetch(`/api/employee/cases/${ticket.id}/start`, {
        method: "POST",
      });
      toast.success("Case started");
      await fetchHolds();
      onComplete?.(ticket.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start case",
      );
    }
  };

  const handleProceed = async () => {
    onActionStart?.(ticket.id, "proceed");
  };

  const handleComplete = async () => {
    try {
      await apiFetch(`/api/employee/cases/${ticket.id}/complete`, {
        method: "POST",
      });
      toast.success("Case completed successfully");
      await fetchHolds();
      onComplete?.(ticket.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete case",
      );
    }
  };

  const handleResume = async () => {
    try {
      const response = await apiFetch<any>(
        `/api/employee/cases/${ticket.id}/resume`,
        { method: "POST" },
      );

      // Check if hold has expired
      if (response.holdExpired) {
        toast.error(
          "Cannot resume: 3-day hold period has expired. This case will be automatically cancelled.",
        );
        // Refetch to get updated case status
        await fetchHolds();
        onComplete?.(ticket.id);
        return;
      }

      toast.success("Case resumed successfully");
      // Refetch holds to update the UI immediately
      await fetchHolds();
      onComplete?.(ticket.id);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to resume case";

      // Check for hold expiration in error message
      if (errorMsg.includes("3-day hold period has expired")) {
        toast.error(
          "Cannot resume: 3-day hold period has expired. This case will be automatically cancelled.",
        );
      } else {
        toast.error(errorMsg);
      }

      // Refetch to ensure UI is in sync
      await fetchHolds();
    }
  };

  const handleHoldSuccess = async () => {
    // Refetch holds immediately to pause the timer
    await fetchHolds();
    onComplete?.(ticket.id);
  };

  const isReceived = ticket.transferredToUserId != null;
  const hasStarted = ticket.employeeStartedAt != null;
  const hasProceeded = ticket.proceededAt != null;
  const isCompleted = ticket.completedAt != null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 rounded-lg border border-border p-3 sm:p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-display font-semibold text-foreground truncate">
            Ticket {ticket.code}
          </h3>
          <Badge
            className={cn("text-xs whitespace-nowrap", toneClasses[statusTone])}
            variant="outline"
          >
            {ticket.status === "done"
              ? t("employee.status.completed")
              : hasActiveHold
                ? t("employee.status.onHold")
                : ticket.status === "on_hold"
                  ? t("employee.status.onHold")
                  : t("employee.received")}
          </Badge>
          {hasActiveHold && timeUntilExpiration !== null && (
            <Badge
              variant="outline"
              className={`text-xs ${
                timeUntilExpiration < 3600000
                  ? toneClasses.danger
                  : timeUntilExpiration < 86400000
                    ? toneClasses.warning
                    : toneClasses.warning
              }`}
            >
              {t("employee.messages.expiresIn")} {formatTimeRemaining(timeUntilExpiration)}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {t("employee.owner")} {ticket.ownerName || "—"} · {t("employee.woreda")} {ticket.woreda || "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("employee.category")} {ticket.serviceCategory || "—"}
        </p>
        {Array.isArray(ticket.selectedServices) &&
          ticket.selectedServices.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("employee.services")} {ticket.selectedServices.join(", ")}
            </p>
          )}
        {ticket.notes && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("employee.notes")} {ticket.notes}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 text-right">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-foreground">
            {formatDuration(duration)}
          </div>
          {ticket.employeeStartedAt &&
            !ticket.proceededAt &&
            !ticket.completedAt && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  ({hasActiveHold ? t("employee.messages.paused") : t("employee.messages.inProgress")}
                </span>
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    hasActiveHold
                      ? "bg-amber-500"
                      : "bg-primary animate-pulse"
                  }`}
                  style={hasActiveHold ? {} : undefined}
                />
                <span className="text-xs text-muted-foreground">)</span>
              </div>
            )}
        </div>
        {ticket.employeeStartedAt && (
          <p className="text-xs text-muted-foreground">
            {new Date(ticket.employeeStartedAt).toLocaleString([], {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        )}
        {!ticket.employeeStartedAt && (
          <p className="text-xs text-muted-foreground">—</p>
        )}
        {ticket.employeeStartedAt && ticket.status === "done" && (
          <p className="text-xs text-muted-foreground">
            to{" "}
            {new Date(ticket.completedAt || 0).toLocaleString([], {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        )}
        {ticket && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {isReceived && !hasStarted && !isCompleted && !hasActiveHold && (
              <Button size="sm" onClick={handleStart}>
                Start
              </Button>
            )}
            {isReceived &&
              hasStarted &&
              !isCompleted &&
              !hasActiveHold &&
              ticket.status !== "on_hold" && (
                <>
                  <Button size="sm" onClick={handleComplete}>
                    Complete
                  </Button>
                  <Button size="sm" onClick={handleProceed} variant="outline">
                    Proceed
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setHoldDialogOpen(true)}
                    variant="outline"
                    className="border-amber-500 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30"
                  >
                    <Pause className="mr-2 h-4 w-4" />Hold
                  </Button>
                </>
              )}
            {(hasActiveHold || ticket.status === "on_hold") && isReceived && (
              <Button
                size="sm"
                onClick={handleResume}
                disabled={timeUntilExpiration === 0}
                className={`${
                  timeUntilExpiration === 0
                    ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
                title={
                  timeUntilExpiration === 0
                    ? "Hold period has expired. Case will be auto-cancelled."
                    : "Click to resume case"
                }
              >
                Resume
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hold Case Dialog */}
      <HoldCaseDialog
        ticket={ticket}
        open={holdDialogOpen}
        onOpenChange={setHoldDialogOpen}
        onSuccess={handleHoldSuccess}
      />
    </div>
  );
};

export default function Employee() {
  const [tab, setTab] = useState<string>("received");
  const [timePeriod, setTimePeriod] = useState<"today" | "week" | "month">(
    "today",
  );
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<"proceed" | null>(null);
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  const statsQuery = useQuery({
    queryKey: ["employee-stats"],
    queryFn: () => apiFetch<EmployeeStats>("/api/employee/stats"),
    refetchInterval: 10000,
    enabled: !!user,
  });

  const ticketsQuery = useQuery({
    queryKey: ["employee-tickets", tab],
    queryFn: () =>
      apiFetch<EmployeeTicketsResponse>(
        `/api/employee/tickets?tab=${encodeURIComponent(tab)}`,
      ),
    refetchInterval: 5000,
    enabled: !!user && user.role === "employee" && tab !== "history",
  });

  const historyQuery = useQuery({
    queryKey: ["employee-history", timePeriod, historyPage],
    queryFn: () => {
      const offset = (historyPage - 1) * itemsPerPage;
      return apiFetch<EmployeeTicketsResponse>(
        `/api/employee/history?timePeriod=${encodeURIComponent(timePeriod)}&limit=${itemsPerPage}&offset=${offset}`,
      );
    },
    refetchInterval: 10000,
    enabled: !!user && user.role === "employee",
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<ListUsersResponse>("/api/admin/users"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const jobTitlesQuery = useQuery({
    queryKey: ["job-titles"],
    queryFn: () => apiFetch<ListJobTitlesResponse>("/api/admin/job-titles"),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Reset history page when time period changes
  useEffect(() => {
    setHistoryPage(1);
  }, [timePeriod]);

  const handleCaseCompleted = () => {
    // Refetch immediately to update the UI
    ticketsQuery.refetch();
  };

  const handleCaseAction = (ticketId: string, action: "start" | "proceed") => {
    setSelectedCaseId(ticketId);
    if (action === "proceed") {
      setSelectedAction("proceed");
      setActionDialogOpen(true);
    }
  };

  const stats = statsQuery.data;
  const tickets = ticketsQuery.data?.items || [];

  // Create a map of user IDs to full names for displaying forwarded-to names
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    usersQuery.data?.users.forEach((user) => {
      map.set(user.id, user.fullName || user.username);
    });
    return map;
  }, [usersQuery.data]);

  const getJobTitleName = useMemo(() => {
    if (!user?.jobTitleId || !jobTitlesQuery.data) return null;
    if (!Array.isArray(jobTitlesQuery.data.jobTitles)) return null;
    const jobTitle = jobTitlesQuery.data.jobTitles.find(
      (jt) => jt.id === user.jobTitleId,
    );
    return jobTitle?.nameAmharic || jobTitle?.nameEnglish || null;
  }, [user?.jobTitleId, jobTitlesQuery.data]);

  const tabItems = useMemo(() => {
    if (tab === "history") {
      const historyTickets = historyQuery.data?.items || [];
      return historyTickets.sort((a, b) => {
        const aTime = a.proceededAt || a.completedAt || 0;
        const bTime = b.proceededAt || b.completedAt || 0;
        return bTime - aTime;
      });
    }
    // received (default) - include on_hold cases so they can be resumed
    return tickets
      .filter(
        (t) =>
          t.status === "transferred" ||
          t.status === "serving" ||
          t.status === "on_hold",
      )
      .sort((a, b) => (b.transferredAt || 0) - (a.transferredAt || 0));
  }, [tickets, tab, historyQuery.data]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {user?.fullName
                ? t("employee.welcome", { name: user.fullName })
                : t("employee.dashboard")}
            </h1>
            {getJobTitleName && (
              <p className="text-sm text-muted-foreground font-medium">
                {getJobTitleName}
              </p>
            )}
            <p className="text-muted-foreground">
              {t("employee.subtitle")}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="rounded-xl border-border/70 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("employee.received")}
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-semibold tracking-tight">
                {stats?.receivedToday ?? 0}
              </div>
              <p className="text-sm text-muted-foreground">{t("employee.today")}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("employee.completed")}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-semibold tracking-tight">
                {stats?.completedToday ?? 0}
              </div>
              <p className="text-sm text-muted-foreground">{t("employee.today")}</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("employee.proceeded")}
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-semibold tracking-tight">
                {stats?.proceedToday ?? 0}
              </div>
              <p className="text-sm text-muted-foreground">{t("employee.today")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cases Tab View */}
        <Card className="rounded-xl border-border/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>{t("employee.cases")}</CardTitle>
            <CardDescription>
              {t("employee.casesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList>
                <TabsTrigger value="received">{t("employee.tabs.received")}</TabsTrigger>
                <TabsTrigger value="history">{t("employee.tabs.history")}</TabsTrigger>
              </TabsList>

              <TabsContent value="received" className="space-y-4 mt-4">
                {ticketsQuery.isPending ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("employee.loadingCases")}
                  </div>
                ) : tabItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("employee.noCases")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tabItems.map((ticket) => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        onComplete={handleCaseCompleted}
                        onActionStart={handleCaseAction}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={timePeriod === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("today")}
                  >
                    {t("employee.timeFilters.today")}
                  </Button>
                  <Button
                    variant={timePeriod === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("week")}
                  >
                    {t("employee.timeFilters.week")}
                  </Button>
                  <Button
                    variant={timePeriod === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriod("month")}
                  >
                    {t("employee.timeFilters.month")}
                  </Button>
                </div>

                {historyQuery.isPending ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("employee.loadingHistory")}
                  </div>
                ) : tabItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("employee.noHistory")}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {tabItems.map((ticket) => (
                        <CaseHistoryRow
                          key={ticket.id}
                          ticket={ticket}
                          userMap={userMap}
                        />
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {historyQuery.data && historyQuery.data.total > 0 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          {t("employee.pagination.showing", {
                            start: (historyPage - 1) * itemsPerPage + 1,
                            end: Math.min(
                              historyPage * itemsPerPage,
                              historyQuery.data.total,
                            ),
                            total: historyQuery.data.total,
                          })}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setHistoryPage((p) => Math.max(1, p - 1))
                            }
                            disabled={historyPage === 1}
                          >
                            {t("employee.pagination.previous")}
                          </Button>
                          <div className="flex items-center gap-2 px-3 py-1 border rounded-md">
                            <span className="text-sm font-medium">
                              {historyPage}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setHistoryPage((p) =>
                                Math.ceil(
                                  historyQuery.data!.total / itemsPerPage,
                                ) > p
                                  ? p + 1
                                  : p,
                              )
                            }
                            disabled={
                              historyPage >=
                              Math.ceil(historyQuery.data!.total / itemsPerPage)
                            }
                          >
                            {t("employee.pagination.next")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <CaseActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        caseId={selectedCaseId || ""}
        action={selectedAction}
        onSuccess={handleCaseCompleted}
        currentUserId={user?.id}
      />
    </div>
  );
}
