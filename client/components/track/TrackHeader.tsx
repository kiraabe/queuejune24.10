export function TrackHeader() {
  return (
    <header className="flex w-full flex-col items-center gap-2 px-4 pt-8 sm:pt-10">
      <img
        src="/logos/lhpria-logo.webp"
        alt="STC Solution logo"
        className="h-12 w-12 rounded-full object-cover shadow-sm"
      />
      <div className="flex flex-col items-center">
        <span className="font-display text-base font-semibold tracking-tight text-slate-900">
          STC Solution
        </span>
        <span className="text-xs text-slate-500">
          Standard time compliance
        </span>
      </div>
    </header>
  );
}
