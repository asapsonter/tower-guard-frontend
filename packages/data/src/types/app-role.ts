/**
 * AppRole — the four user roles that map 1:1 to the four apps in the monorepo.
 *
 * Each app uses useRoleGuard to redirect users with the wrong role to their
 * correct app. The backend additionally verifies the role on every API call
 * via require_role(allowed: list[AppRole]).
 */
export type AppRole =
  | "telecom_admin"
  | "nscdc_command"
  | "nscdc_responder"
  | "ncc_regulator";

export const APP_ROLES: readonly AppRole[] = [
  "telecom_admin",
  "nscdc_command",
  "nscdc_responder",
  "ncc_regulator",
] as const;

export const isAppRole = (value: unknown): value is AppRole => {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
};

/**
 * Returns the production URL for a given role's home app.
 * In dev each app runs on a different port; in prod each is its own Vercel
 * project. Switch these to the towerguard.ng subdomains once their DNS exists.
 */
export const HOME_URL_FOR_ROLE: Record<AppRole, { dev: string; prod: string }> = {
  telecom_admin: { dev: "http://localhost:5173", prod: "https://tower-guard-frontend-dashboard-main.vercel.app" },
  nscdc_command: { dev: "http://localhost:5174", prod: "https://tower-guard-frontend-dashboard-nscd.vercel.app" },
  ncc_regulator: { dev: "http://localhost:5175", prod: "https://tower-guard-frontend-dashboard-ncc.vercel.app" },
  nscdc_responder: { dev: "http://localhost:5176", prod: "https://tower-guard-frontend-app-field.vercel.app" },
};

/** Human-readable name of each role's home app. */
export const APP_NAME_FOR_ROLE: Record<AppRole, string> = {
  telecom_admin: "ITIPS Operator Command Dashboard",
  nscdc_command: "NSCDC Command Dashboard",
  ncc_regulator: "NCC Monitoring Dashboard",
  nscdc_responder: "NSCDC Field App",
};

export function getHomeUrlForRole(role: AppRole): string {
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
  return HOME_URL_FOR_ROLE[role][isDev ? "dev" : "prod"];
}
