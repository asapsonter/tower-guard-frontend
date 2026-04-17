// Resolve the FCT Area Council containing a lat/lng. Uses coarse bounding
// boxes — accurate enough to pick the right council from the 6 FCT ACs,
// but NOT a substitute for a proper polygon dataset.
//
// The six FCT Area Councils and their approximate extents:
//   AMAC       — Abuja Municipal (central FCT)
//   Bwari      — north
//   Gwagwalada — west-central
//   Kuje       — south-central
//   Kwali      — south-west
//   Abaji      — far south-west

export type FctCouncil = "AMAC" | "Bwari" | "Gwagwalada" | "Kuje" | "Kwali" | "Abaji";

interface BBox { minLat: number; maxLat: number; minLng: number; maxLng: number; }

const COUNCIL_BBOX: Record<FctCouncil, BBox> = {
  AMAC:       { minLat: 8.85,  maxLat: 9.15, minLng: 7.35, maxLng: 7.70 },
  Bwari:      { minLat: 9.15,  maxLat: 9.45, minLng: 7.25, maxLng: 7.75 },
  Gwagwalada: { minLat: 8.75,  maxLat: 9.10, minLng: 7.00, maxLng: 7.35 },
  Kuje:       { minLat: 8.55,  maxLat: 8.90, minLng: 7.10, maxLng: 7.50 },
  Kwali:      { minLat: 8.60,  maxLat: 8.95, minLng: 6.90, maxLng: 7.20 },
  Abaji:      { minLat: 8.35,  maxLat: 8.75, minLng: 6.70, maxLng: 7.15 },
};

// Bounding box of the whole FCT (approx). Used to decide if a location is
// outside the territory entirely.
const FCT_BBOX: BBox = { minLat: 8.35, maxLat: 9.45, minLng: 6.70, maxLng: 7.75 };

function inside(bbox: BBox, lat: number, lng: number): boolean {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
}

export type CouncilResolution =
  | { scope: "council"; council: FctCouncil }
  | { scope: "fct"; council: null }       // inside FCT but not any known AC box
  | { scope: "out-of-fct"; council: null };

export function resolveFctCouncil(lat: number, lng: number): CouncilResolution {
  for (const [name, bbox] of Object.entries(COUNCIL_BBOX) as [FctCouncil, BBox][]) {
    if (inside(bbox, lat, lng)) return { scope: "council", council: name };
  }
  if (inside(FCT_BBOX, lat, lng)) return { scope: "fct", council: null };
  return { scope: "out-of-fct", council: null };
}
