import { RefreshCw, ShieldCheck, Zap } from "lucide-react";

const indicators = [
  {
    icon: Zap,
    title: "Fast & Simple",
    description: "Check your status in seconds",
  },
  {
    icon: RefreshCw,
    title: "Real-time Updates",
    description: "Get the latest information",
  },
  {
    icon: ShieldCheck,
    title: "Reliable Service",
    description: "Your satisfaction matters",
  },
];

export function TrackTrustRow() {
  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-3">
      {indicators.map(({ icon: Icon, title, description }) => (
        <li
          key={title}
          className="flex items-center gap-3 rounded-xl border border-border/70 bg-white px-4 py-3 shadow-sm"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
