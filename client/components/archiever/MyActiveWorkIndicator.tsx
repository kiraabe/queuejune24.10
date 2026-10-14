import { AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";

interface MyActiveWorkIndicatorProps {
  ticketCode?: string;
  startTime?: number;
  isWorkingOnTicket?: boolean;
}

export function MyActiveWorkIndicator({
  ticketCode,
  startTime,
  isWorkingOnTicket,
}: MyActiveWorkIndicatorProps) {
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState("0m 0s");

  useEffect(() => {
    if (!startTime || !isWorkingOnTicket) return;

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = now - startTime;
      const totalSeconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setElapsedTime(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, isWorkingOnTicket]);

  if (!isWorkingOnTicket || !ticketCode) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("archiever.indicator.noActive")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("archiever.indicator.selectPrompt")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full animate-pulse bg-emerald-500" />
            <CardTitle className="text-base">{t("archiever.indicator.processing")}</CardTitle>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{t("archiever.indicator.active")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t("archiever.workspace.ticketCode")}</p>
          <p className="text-2xl md:text-3xl font-semibold tracking-tight text-primary">{ticketCode}</p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-3">
          <Clock className="h-5 w-5 text-emerald-700 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{t("archiever.indicator.elapsedTime")}</p>
            <p className="text-lg font-semibold text-foreground">
              {elapsedTime}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t("archiever.indicator.note")}
        </p>
      </CardContent>
    </Card>
  );
}
