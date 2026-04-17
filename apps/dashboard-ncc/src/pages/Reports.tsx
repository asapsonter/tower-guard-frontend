import type { ProviderShort } from "../App";
import NCCDashboardLayout from "./NCCDashboardLayout";
export default function Reports({ provider, state }: { provider?: ProviderShort | null; state?: string | null }) {
  return <NCCDashboardLayout provider={provider} state={state} />;
}
