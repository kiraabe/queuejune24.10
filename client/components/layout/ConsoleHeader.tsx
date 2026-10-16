import { Link } from "react-router-dom";
import { UserProfileDropdown } from "@/components/profile/UserProfileDropdown";

export function ConsoleHeader() {
  return (
    <header className="w-full border-b border-border/70 bg-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/logos/lhpria-logo.webp"
            alt="STC Solution logo"
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-sm font-semibold tracking-tight text-foreground truncate">
              STC Solution
            </span>
            <span className="text-xs text-muted-foreground truncate">
              Standard time compliance
            </span>
          </div>
        </Link>
        <UserProfileDropdown />
      </div>
    </header>
  );
}
