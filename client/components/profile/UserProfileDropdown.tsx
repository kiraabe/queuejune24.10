import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSubMenu } from "./LanguageSubMenu";
import {
  userMenuContentClass,
  userMenuDestructiveClass,
  userMenuIconClass,
  userMenuItemClass,
  userMenuSeparatorClass,
} from "./user-menu-styles";
import { cn } from "@/lib/utils";

export function UserProfileDropdown() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to sign out");
      setIsLoggingOut(false);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (fullName?: string, username?: string): string => {
    const name = fullName || username;
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(user.fullName, user.username);
  const isReception = user.role === "reception";

  const identityHeader = (
    <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
      <Avatar className="h-10 w-10 border border-border">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">
          {user.fullName || user.username}
        </p>
        <p className="truncate text-xs capitalize leading-tight text-muted-foreground">
          {user.role}
        </p>
      </div>
    </DropdownMenuLabel>
  );

  const logoutItem = (
    <DropdownMenuItem
      onSelect={handleLogout}
      disabled={isLoggingOut}
      className={cn(userMenuItemClass, userMenuDestructiveClass)}
    >
      <LogOut className={userMenuIconClass} />
      <span>{isLoggingOut ? t("buttons.signingOut") : t("buttons.logout")}</span>
    </DropdownMenuItem>
  );

  // For reception users, show simplified dropdown with just language and logout
  if (isReception) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-2 h-10"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium leading-none truncate max-w-[150px]">
                {user.fullName || user.username}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {user.role}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className={userMenuContentClass}
        >
          {identityHeader}

          <DropdownMenuSeparator className={userMenuSeparatorClass} />

          <LanguageSubMenu />

          <DropdownMenuSeparator className={userMenuSeparatorClass} />

          {logoutItem}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For other roles, show full dropdown menu with profile option
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2 h-10"
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start gap-0.5">
            <span className="text-sm font-medium leading-none truncate max-w-[150px]">
              {user.fullName || user.username}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {user.role}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className={userMenuContentClass}
      >
        {identityHeader}

        <DropdownMenuSeparator className={userMenuSeparatorClass} />

        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => navigate("/profile")} className={userMenuItemClass}>
            <User className={userMenuIconClass} />
            <span>{t("buttons.myProfile")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className={userMenuSeparatorClass} />

        <LanguageSubMenu />

        <DropdownMenuSeparator className={userMenuSeparatorClass} />

        {logoutItem}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
