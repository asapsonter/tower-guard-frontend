import { Link, useParams } from "react-router-dom";
import { Box, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ops/Panel";
import { fmtNum, useOps, useSite } from "@/lib/ops";
import { SiteDirectory } from "./twin/SiteDirectory";
import { SiteTwinView } from "./twin/SiteTwinView";

const FEATURED_INCIDENT = "INC-2026-10482";

export default function SiteTwin() {
  const { id } = useParams<{ id: string }>();
  const { snap, incident } = useOps();
  const siteId = id ?? incident(FEATURED_INCIDENT)?.siteId ?? snap?.sites[0]?.id;
  const { site, loading, error } = useSite(siteId);
  if (!snap) return null;

  return (
    <>
      <PageHeader title="Live Site Digital Twin" icon={Box}
        subtitle={`Site Security Digital Twin for every one of ${fmtNum(snap.sites.length)} protected sites — identity, assets, cameras, sensors, access and risk in one view`}
        actions={!id && siteId ? <span className="hud-chip">Showing site of {FEATURED_INCIDENT}</span> : undefined} />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-3 min-w-0">
          <SiteDirectory sites={snap.sites} selectedId={siteId} />
        </div>
        <div className="col-span-12 xl:col-span-9 min-w-0">
          {site && site.id === siteId ? (
            <SiteTwinView key={site.id} site={site} />
          ) : siteId && (loading || !error) ? (
            <div className="glass-panel flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />Building digital twin for <span className="font-mono text-foreground">{siteId}</span>…
            </div>
          ) : (
            <div className="glass-panel p-6 text-sm text-muted-foreground">
              {error ? <>Could not load site <span className="font-mono text-foreground">{siteId}</span> ({error}). </> : "No site selected. "}
              <Link to="/sites" className="text-primary hover:underline">Back to directory</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
