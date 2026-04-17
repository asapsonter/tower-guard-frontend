/**
 * NSCDC Overview page — `/`
 * Renders the shared NSCDCDashboardLayout, which derives the active tab from
 * the URL via useLocation.
 */
import NSCDCDashboardLayout from "./NSCDCDashboardLayout";

export default function Overview() {
  return <NSCDCDashboardLayout />;
}
