import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  userMenuContentClass,
  userMenuIconClass,
  userMenuItemClass,
} from "@/components/profile/user-menu-styles";
import {
  Language,
  LANGUAGE_LABELS,
  useLanguage,
} from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export function LanguageMenu({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2 px-2 h-10", className)}
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">{LANGUAGE_LABELS[language]}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className={cn(userMenuContentClass, "w-52 border-slate-300")}
      >
        {Object.entries(LANGUAGE_LABELS).map(([lang, label]) => {
          const isActive = language === lang;
          return (
            <DropdownMenuItem
              key={lang}
              onSelect={() => setLanguage(lang as Language)}
              className={cn(
                userMenuItemClass,
                "justify-between",
                isActive && "font-medium text-primary",
              )}
            >
              <span>{label}</span>
              {isActive && (
                <Check className={cn(userMenuIconClass, "text-primary")} aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
