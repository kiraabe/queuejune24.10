import { APP_VERSION } from "@/lib/app-version";

export function TrackFooter() {
  return (
    <footer className="border-t border-border/70 bg-white/60 px-4 py-4 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} STC Solution. All rights reserved.
      <span className="ml-2 text-slate-400">v{APP_VERSION}</span>
    </footer>
  );
}
