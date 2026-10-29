import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { homePathForUser } from "@/lib/role-home";

/**
 * Keeps logged-in users with a role panel off public pages (home, queue, display, login).
 */
export function RestrictPublicAccess() {
  const { user } = useAuth();

  if (user === undefined) return null; // loading state

  if (user) {
    const home = homePathForUser(user);
    if (home) return <Navigate to={home} replace />;
  }

  // Allow access to public routes for non-restricted roles or unauthenticated users
  return <Outlet />;
}
