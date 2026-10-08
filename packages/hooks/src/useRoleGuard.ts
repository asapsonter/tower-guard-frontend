/**
 * useRoleGuard — detects users who land on the wrong app for their role.
 *
 * Usage in each app's <App />:
 *   const guard = useRoleGuard("telecom_admin")    // dashboard-main
 *   const guard = useRoleGuard("nscdc_command")    // dashboard-nscdc
 *   const guard = useRoleGuard("ncc_regulator")    // dashboard-ncc
 *   const guard = useRoleGuard("nscdc_responder")  // app-field
 *
 * When `guard.mismatch` is true, render <RoleMismatchScreen> (from
 * @tower-guard/ui) instead of the app. We deliberately do NOT auto-redirect:
 * a remembered session would bounce people to another app before they ever
 * see this app's sign-in page, which looks like the link is broken.
 */
import { type AppRole, APP_NAME_FOR_ROLE, getHomeUrlForRole } from "@tower-guard/data";
import { useAuth } from "./useAuth";

export interface RoleGuardResult {
  /** True when the signed-in account belongs to a different app. */
  mismatch: boolean;
  accountAppName: string | null;
  accountAppUrl: string | null;
  thisAppName: string;
}

export function useRoleGuard(expected: AppRole): RoleGuardResult {
  const { user, isLoading } = useAuth();
  const mismatch = !isLoading && !!user && user.app_role !== expected;
  return {
    mismatch,
    accountAppName: mismatch ? APP_NAME_FOR_ROLE[user!.app_role] : null,
    accountAppUrl: mismatch ? getHomeUrlForRole(user!.app_role) : null,
    thisAppName: APP_NAME_FOR_ROLE[expected],
  };
}
