import { Check, Globe } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language, LANGUAGE_LABELS } from "@/hooks/use-language";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { userMenuItemClass, userMenuSubContentClass } from "./user-menu-styles";

export function LanguageSubMenu() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={userMenuItemClass}>
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1">{t("buttons.language")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        className={userMenuSubContentClass}
        sideOffset={6}
        alignOffset={-6}
        collisionPadding={12}
      >
        {Object.entries(LANGUAGE_LABELS).map(([lang, label]) => {
          const isActive = language === lang;
          return (
            <DropdownMenuItem
              key={lang}
              onSelect={() => setLanguage(lang as Language)}
              className={cn(userMenuItemClass, "justify-between", isActive && "font-medium text-primary")}
            >
              <span>{label}</span>
              {isActive && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
