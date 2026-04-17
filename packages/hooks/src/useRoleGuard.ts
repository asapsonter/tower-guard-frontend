/**
 * useRoleGuard — redirects users who land on the wrong app for their role.
 *
 * Usage in each app's <App />:
 *   useRoleGuard("telecom_admin")    // dashboard-main
 *   useRoleGuard("nscdc_command")    // dashboard-nscdc
 *   useRoleGuard("ncc_regulator")    // dashboard-ncc
 *   useRoleGuard("nscdc_responder")  // app-field
 *
 * Behavior:
 *   - If the user is not yet loaded, do nothing (auth bootstrap window).
 *   - If the user's role matches `expected`, do nothing.
 *   - If the user's role differs, hard-redirect to that role's home URL
 *     (computed by getHomeUrlForRole, which knows dev ports vs. prod subdomains).
 *
 * The hard redirect via window.location.href is intentional: each app is
 * a separate Vite build deployed to a separate origin, so SPA navigation
 * cannot cross app boundaries.
 */
import { useEffect } from "react";
import { type AppRole, getHomeUrlForRole } from "@tower-guard/data";
import { useAuth } from "./useAuth";

export function useRoleGuard(expected: AppRole) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.app_role === expected) return;

    const targetUrl = getHomeUrlForRole(user.app_role);
    // Avoid redirect loops if we're already at the target origin
    if (typeof window !== "undefined" && !window.location.href.startsWith(targetUrl)) {
      window.location.href = targetUrl;
    }
  }, [user, isLoading, expected]);
}
