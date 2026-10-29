import type { AuthUser } from "@shared/api";

/** Returns the role's panel path, or null when the role has no panel (e.g. teller without a window). */
export function homePathForUser(
  user: Pick<AuthUser, "role" | "windowId">,
): string | null {
  switch (user.role) {
    case "admin":
      return "/admin";
    case "reception":
      return "/reception";
    case "teller":
      return user.windowId ? `/teller/${user.windowId}` : null;
    case "employee":
      return "/employee";
    case "archiever":
      return "/archiever";
    default:
      return null;
  }
}
