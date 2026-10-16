export function TrackHeader() {
  return (
    <header className="w-full border-b border-border/70 bg-white">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <img
          src="/logos/lhpria-logo.webp"
          alt="STC Solution logo"
          className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col">
          <span className="font-display text-sm font-semibold tracking-tight text-slate-900">
            STC Solution
          </span>
          <span className="text-xs text-slate-500">
            Standard time compliance
          </span>
        </div>
      </div>
    </header>
  );
}
