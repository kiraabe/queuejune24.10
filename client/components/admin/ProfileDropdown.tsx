import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Settings, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSubMenu } from "@/components/profile/LanguageSubMenu";
import {
  userMenuContentClass,
  userMenuDestructiveClass,
  userMenuIconClass,
  userMenuItemClass,
  userMenuSeparatorClass,
} from "@/components/profile/user-menu-styles";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface ProfileDropdownProps {
  navItems: NavItem[];
}

export function ProfileDropdown({ navItems }: ProfileDropdownProps) {
  const { user, logout } = useAuth();

  const settingsItem = navItems.find((item) => item.id === "settings");
  const profileItem = navItems.find((item) => item.id === "profile");

  const displayName = user?.fullName || user?.username || "Admin User";
  const initials = (user?.fullName || user?.username || "AD")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-9 w-9 border border-border shadow-sm">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={userMenuContentClass}
        align="end"
        sideOffset={8}
        collisionPadding={12}
        forceMount
      >
        <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{displayName}</p>
            <p className="truncate text-xs capitalize leading-tight text-muted-foreground">
              {user?.role || "Administrator"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className={userMenuSeparatorClass} />
        {profileItem && (
          <DropdownMenuItem onSelect={profileItem.onClick} className={userMenuItemClass}>
            <User className={userMenuIconClass} />
            <span>Profile</span>
          </DropdownMenuItem>
        )}
        {settingsItem && (
          <DropdownMenuItem onSelect={settingsItem.onClick} className={userMenuItemClass}>
            <Settings className={userMenuIconClass} />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className={userMenuSeparatorClass} />
        <LanguageSubMenu />
        <DropdownMenuSeparator className={userMenuSeparatorClass} />
        <DropdownMenuItem
          onSelect={() => logout()}
          className={cn(userMenuItemClass, userMenuDestructiveClass)}
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
