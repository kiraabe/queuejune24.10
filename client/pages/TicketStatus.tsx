import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useSSE } from "@/hooks/use-sse";
import { TrackHeader } from "@/components/track/TrackHeader";
import type { Ticket, TicketStatusResponse } from "@shared/api";

async function fetchStatus(code: string): Promise<TicketStatusResponse> {
  const res = await fetch(`/api/tickets/${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const detailTileClass =
  "rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3";
const detailLabelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const detailValueClass = "mt-1 text-base font-medium text-slate-900";

export default function TicketStatus() {
  const { code = "" } = useParams<{ code: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [estSeconds, setEstSeconds] = useState<number | null>(null);

  useEffect(() => {
    let stop = false;
    if (!code) return;
    fetchStatus(code)
      .then((d) => {
        if (stop) return;
        setTicket(d.ticket);
        setPosition(d.positionInQueue);
        setEstSeconds(d.estimatedWaitSeconds ?? null);
      })
      .catch(() => {});
    const id = setInterval(() => {
      fetchStatus(code)
        .then((d) => {
          if (stop) return;
          setTicket(d.ticket);
          setPosition(d.positionInQueue);
          setEstSeconds(d.estimatedWaitSeconds ?? null);
        })
        .catch(() => {});
    }, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [code]);

  useSSE("/api/events", (ev) => {
    if (ev.type === "ticket.updated") {
      const t = ev.payload as Ticket;
      if (t.code === code) {
        setTicket(t);
        fetchStatus(code)
          .then((d) => {
            setPosition(d.positionInQueue);
            setEstSeconds(d.estimatedWaitSeconds ?? null);
          })
          .catch(() => {});
      }
      return;
    }
    if (ev.type === "display.updated" || ev.type === "window.updated") {
      // Queue moved; refresh status for this code so position/ETA stay live
      fetchStatus(code)
        .then((d) => {
          setTicket(d.ticket);
          setPosition(d.positionInQueue);
          setEstSeconds(d.estimatedWaitSeconds ?? null);
        })
        .catch(() => {});
    }
  });

  if (!code) return <div className="container py-10">Missing ticket code.</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-sky-50/60">
      <TrackHeader />

      <main className="flex flex-1 justify-center px-4 pb-12 pt-8">
        <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Your Ticket
            </h1>
            {ticket && (
              <Badge variant="secondary" className="uppercase">
                {ticket.status}
              </Badge>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                Ticket number
              </p>
              <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
                {code}
              </p>
            </div>

            <div className={detailTileClass}>
              <p className={detailLabelClass}>Status</p>
              <p className={detailValueClass}>{ticket?.status ?? "—"}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className={detailTileClass}>
                <p className={detailLabelClass}>Service</p>
                <p className={detailValueClass}>{ticket?.service ?? "—"}</p>
              </div>
              <div className={detailTileClass}>
                <p className={detailLabelClass}>Window</p>
                <p className={detailValueClass}>
                  {ticket?.windowId ? `Window ${ticket.windowId}` : "—"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className={detailTileClass}>
                <p className={detailLabelClass}>Position</p>
                <p className={detailValueClass}>{position ?? "—"}</p>
              </div>
              <div className={detailTileClass}>
                <p className={detailLabelClass}>Est. wait</p>
                <p className={detailValueClass}>
                  {estSeconds == null
                    ? "—"
                    : `${Math.max(0, Math.round(estSeconds / 60))} min`}
                </p>
              </div>
              <div className={detailTileClass}>
                <p className={detailLabelClass}>Created</p>
                <p className={detailValueClass}>
                  {ticket
                    ? new Date(ticket.createdAt).toLocaleTimeString()
                    : "—"}
                </p>
              </div>
            </div>

            <div className={detailTileClass}>
              <p className={detailLabelClass}>Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {ticket?.notes || "—"}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
