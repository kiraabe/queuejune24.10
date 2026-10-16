import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSubMenu } from "@/components/profile/LanguageSubMenu";
import { userMenuContentClass } from "@/components/profile/user-menu-styles";
import { LANGUAGE_LABELS, useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export function LanguageMenu({ className }: { className?: string }) {
  const { language } = useLanguage();

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
        className={userMenuContentClass}
      >
        <LanguageSubMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
