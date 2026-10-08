import type { GeoPoint, Zone } from "./types.js";

/** State capitals (approximate) with geopolitical zone. FCT listed as "FCT". */
export const STATES: { state: string; capital: string; zone: Zone; lat: number; lng: number; code: string; areas: string[] }[] = [
  { state: "FCT", capital: "Abuja", zone: "North-Central", lat: 9.0765, lng: 7.3986, code: "ABJ", areas: ["AMAC", "Bwari", "Gwagwalada", "Kuje"] },
  { state: "Kaduna", capital: "Kaduna", zone: "North-West", lat: 10.5105, lng: 7.4165, code: "KAD", areas: ["Kaduna North", "Kaduna South", "Chikun", "Zaria"] },
  { state: "Lagos", capital: "Ikeja", zone: "South-West", lat: 6.6018, lng: 3.3515, code: "LAG", areas: ["Ikeja", "Eti-Osa", "Alimosho", "Ikorodu"] },
  { state: "Rivers", capital: "Port Harcourt", zone: "South-South", lat: 4.8156, lng: 7.0498, code: "PHC", areas: ["Port Harcourt", "Obio/Akpor", "Eleme"] },
  { state: "Kano", capital: "Kano", zone: "North-West", lat: 12.0022, lng: 8.592, code: "KAN", areas: ["Kano Municipal", "Nassarawa", "Fagge"] },
  { state: "Oyo", capital: "Ibadan", zone: "South-West", lat: 7.3775, lng: 3.947, code: "OYO", areas: ["Ibadan North", "Akinyele", "Ogbomosho"] },
  { state: "Enugu", capital: "Enugu", zone: "South-East", lat: 6.4584, lng: 7.5464, code: "ENU", areas: ["Enugu North", "Nsukka"] },
  { state: "Delta", capital: "Asaba", zone: "South-South", lat: 6.1985, lng: 6.7319, code: "DEL", areas: ["Oshimili South", "Warri South"] },
  { state: "Niger", capital: "Minna", zone: "North-Central", lat: 9.6139, lng: 6.5569, code: "NIG", areas: ["Chanchaga", "Suleja"] },
  { state: "Plateau", capital: "Jos", zone: "North-Central", lat: 9.8965, lng: 8.8583, code: "PLA", areas: ["Jos North", "Jos South"] },
  { state: "Edo", capital: "Benin City", zone: "South-South", lat: 6.335, lng: 5.6037, code: "EDO", areas: ["Oredo", "Egor"] },
  { state: "Ogun", capital: "Abeokuta", zone: "South-West", lat: 7.1475, lng: 3.3619, code: "OGU", areas: ["Abeokuta South", "Ado-Odo/Ota"] },
  { state: "Anambra", capital: "Awka", zone: "South-East", lat: 6.2104, lng: 7.0741, code: "ANA", areas: ["Awka South", "Onitsha North"] },
  { state: "Kogi", capital: "Lokoja", zone: "North-Central", lat: 7.8023, lng: 6.7333, code: "KOG", areas: ["Lokoja", "Okene"] },
  { state: "Nasarawa", capital: "Lafia", zone: "North-Central", lat: 8.4939, lng: 8.5153, code: "NAS", areas: ["Lafia", "Karu"] },
  { state: "Benue", capital: "Makurdi", zone: "North-Central", lat: 7.7337, lng: 8.5214, code: "BEN", areas: ["Makurdi"] },
  { state: "Kwara", capital: "Ilorin", zone: "North-Central", lat: 8.4966, lng: 4.5421, code: "KWA", areas: ["Ilorin West"] },
  { state: "Katsina", capital: "Katsina", zone: "North-West", lat: 12.9908, lng: 7.6018, code: "KAT", areas: ["Katsina"] },
  { state: "Sokoto", capital: "Sokoto", zone: "North-West", lat: 13.0059, lng: 5.2476, code: "SOK", areas: ["Sokoto North"] },
  { state: "Zamfara", capital: "Gusau", zone: "North-West", lat: 12.1704, lng: 6.6641, code: "ZAM", areas: ["Gusau"] },
  { state: "Kebbi", capital: "Birnin Kebbi", zone: "North-West", lat: 12.4539, lng: 4.1975, code: "KEB", areas: ["Birnin Kebbi"] },
  { state: "Jigawa", capital: "Dutse", zone: "North-West", lat: 11.7562, lng: 9.3388, code: "JIG", areas: ["Dutse"] },
  { state: "Borno", capital: "Maiduguri", zone: "North-East", lat: 11.8333, lng: 13.15, code: "BOR", areas: ["Maiduguri"] },
  { state: "Bauchi", capital: "Bauchi", zone: "North-East", lat: 10.3158, lng: 9.8442, code: "BAU", areas: ["Bauchi"] },
  { state: "Gombe", capital: "Gombe", zone: "North-East", lat: 10.2897, lng: 11.1673, code: "GOM", areas: ["Gombe"] },
  { state: "Adamawa", capital: "Yola", zone: "North-East", lat: 9.2035, lng: 12.4954, code: "ADA", areas: ["Yola North"] },
  { state: "Taraba", capital: "Jalingo", zone: "North-East", lat: 8.8937, lng: 11.3596, code: "TAR", areas: ["Jalingo"] },
  { state: "Yobe", capital: "Damaturu", zone: "North-East", lat: 11.7479, lng: 11.966, code: "YOB", areas: ["Damaturu"] },
  { state: "Imo", capital: "Owerri", zone: "South-East", lat: 5.485, lng: 7.035, code: "IMO", areas: ["Owerri Municipal"] },
  { state: "Abia", capital: "Umuahia", zone: "South-East", lat: 5.5249, lng: 7.4942, code: "ABI", areas: ["Umuahia North", "Aba South"] },
  { state: "Ebonyi", capital: "Abakaliki", zone: "South-East", lat: 6.3249, lng: 8.1137, code: "EBO", areas: ["Abakaliki"] },
  { state: "Akwa Ibom", capital: "Uyo", zone: "South-South", lat: 5.0377, lng: 7.9128, code: "AKW", areas: ["Uyo"] },
  { state: "Cross River", capital: "Calabar", zone: "South-South", lat: 4.9757, lng: 8.3417, code: "CRS", areas: ["Calabar Municipal"] },
  { state: "Bayelsa", capital: "Yenagoa", zone: "South-South", lat: 4.9267, lng: 6.2676, code: "BAY", areas: ["Yenagoa"] },
  { state: "Ondo", capital: "Akure", zone: "South-West", lat: 7.2526, lng: 5.1931, code: "OND", areas: ["Akure South"] },
  { state: "Osun", capital: "Osogbo", zone: "South-West", lat: 7.7827, lng: 4.5418, code: "OSU", areas: ["Osogbo"] },
  { state: "Ekiti", capital: "Ado-Ekiti", zone: "South-West", lat: 7.6233, lng: 5.2209, code: "EKI", areas: ["Ado-Ekiti"] },
];

/** Named localities used for incident sites, keyed by state. */
export const LOCALITIES: Record<string, { name: string; lat: number; lng: number; area: string }[]> = {
  FCT: [
    { name: "Kubwa", lat: 9.1561, lng: 7.3222, area: "Bwari" },
    { name: "Maitama", lat: 9.0882, lng: 7.4934, area: "AMAC" },
    { name: "Gwarinpa", lat: 9.1099, lng: 7.4042, area: "AMAC" },
    { name: "Lugbe", lat: 8.9761, lng: 7.3711, area: "AMAC" },
    { name: "Karu", lat: 9.0089, lng: 7.5867, area: "AMAC" },
    { name: "Dutse Alhaji", lat: 9.1532, lng: 7.4296, area: "Bwari" },
    { name: "Gwagwalada", lat: 8.9425, lng: 7.0833, area: "Gwagwalada" },
    { name: "Kuje", lat: 8.8796, lng: 7.2276, area: "Kuje" },
    { name: "Zuba", lat: 9.0915, lng: 7.2141, area: "Gwagwalada" },
    { name: "Jabi", lat: 9.0643, lng: 7.4237, area: "AMAC" },
  ],
  Kaduna: [
    { name: "Kawo", lat: 10.5536, lng: 7.4472, area: "Kaduna North" },
    { name: "Malali", lat: 10.5481, lng: 7.4642, area: "Kaduna North" },
    { name: "Barnawa", lat: 10.4851, lng: 7.4283, area: "Kaduna South" },
    { name: "Kakuri", lat: 10.4683, lng: 7.4232, area: "Kaduna South" },
    { name: "Kujama", lat: 10.4167, lng: 7.6333, area: "Chikun" },
    { name: "Jaji", lat: 10.8167, lng: 7.5833, area: "Zaria" },
    { name: "Rigasa", lat: 10.5167, lng: 7.3667, area: "Kaduna North" },
    { name: "Kateri (Abuja–Kaduna Hwy)", lat: 9.85, lng: 7.33, area: "Chikun" },
  ],
  Lagos: [
    { name: "Ikeja GRA", lat: 6.5833, lng: 3.35, area: "Ikeja" },
    { name: "Lekki Phase 1", lat: 6.4474, lng: 3.4733, area: "Eti-Osa" },
    { name: "Ikotun", lat: 6.5534, lng: 3.2726, area: "Alimosho" },
    { name: "Egbeda", lat: 6.5946, lng: 3.2856, area: "Alimosho" },
    { name: "Ikorodu Garage", lat: 6.6194, lng: 3.5105, area: "Ikorodu" },
    { name: "Ajah", lat: 6.4677, lng: 3.5779, area: "Eti-Osa" },
  ],
  Rivers: [
    { name: "Rumuokoro", lat: 4.8706, lng: 6.9947, area: "Obio/Akpor" },
    { name: "Trans-Amadi", lat: 4.8124, lng: 7.0429, area: "Port Harcourt" },
    { name: "Oyigbo", lat: 4.8786, lng: 7.1281, area: "Eleme" },
    { name: "Eleme Junction", lat: 4.7944, lng: 7.1167, area: "Eleme" },
  ],
  Kano: [
    { name: "Sabon Gari", lat: 12.0167, lng: 8.5333, area: "Fagge" },
    { name: "Nassarawa GRA", lat: 11.9833, lng: 8.55, area: "Nassarawa" },
    { name: "Kano–Katsina Rd", lat: 12.15, lng: 8.4, area: "Kano Municipal" },
  ],
  Oyo: [
    { name: "Bodija", lat: 7.4352, lng: 3.9133, area: "Ibadan North" },
    { name: "Moniya", lat: 7.5167, lng: 3.9, area: "Akinyele" },
    { name: "Ogbomosho Rd", lat: 8.1333, lng: 4.25, area: "Ogbomosho" },
  ],
  Niger: [
    { name: "Suleja", lat: 9.1806, lng: 7.1794, area: "Suleja" },
    { name: "Tunga", lat: 9.6, lng: 6.55, area: "Chanchaga" },
  ],
};

export const RECOVERY_MARKETS: { name: string; state: string; lat: number; lng: number }[] = [
  { name: "Dei-Dei Building Materials Market", state: "FCT", lat: 9.1081, lng: 7.2803 },
  { name: "Kugbo Scrap Market", state: "FCT", lat: 9.0255, lng: 7.5544 },
  { name: "Kasuwan Barci", state: "Kaduna", lat: 10.53, lng: 7.43 },
  { name: "Ladipo Spare Parts Market", state: "Lagos", lat: 6.5375, lng: 3.3478 },
  { name: "Owode Onirin Scrap Market", state: "Lagos", lat: 6.6311, lng: 3.4056 },
  { name: "Oil Mill Market", state: "Rivers", lat: 4.8655, lng: 7.0662 },
  { name: "Kofar Wambai Market", state: "Kano", lat: 12.0, lng: 8.52 },
  { name: "Suleja Scrap Yard", state: "Niger", lat: 9.19, lng: 7.18 },
];

export const CORRIDORS: { id: string; name: string; path: GeoPoint[] }[] = [
  { id: "COR-ABJ-KAD", name: "Abuja–Kaduna Expressway", path: [{ lat: 9.07, lng: 7.4 }, { lat: 9.18, lng: 7.18 }, { lat: 9.55, lng: 7.3 }, { lat: 9.85, lng: 7.33 }, { lat: 10.2, lng: 7.38 }, { lat: 10.51, lng: 7.42 }] },
  { id: "COR-LAG-IBD", name: "Lagos–Ibadan Expressway", path: [{ lat: 6.6, lng: 3.35 }, { lat: 6.8, lng: 3.45 }, { lat: 7.1, lng: 3.6 }, { lat: 7.38, lng: 3.95 }] },
  { id: "COR-PHC-ABA", name: "Port Harcourt–Aba Road", path: [{ lat: 4.82, lng: 7.05 }, { lat: 4.88, lng: 7.13 }, { lat: 5.0, lng: 7.25 }, { lat: 5.11, lng: 7.37 }] },
  { id: "COR-KAN-KAT", name: "Kano–Katsina Road", path: [{ lat: 12.0, lng: 8.59 }, { lat: 12.3, lng: 8.2 }, { lat: 12.65, lng: 7.9 }, { lat: 12.99, lng: 7.6 }] },
  { id: "COR-ABJ-LOK", name: "Abuja–Lokoja Highway", path: [{ lat: 8.95, lng: 7.08 }, { lat: 8.6, lng: 6.95 }, { lat: 8.2, lng: 6.8 }, { lat: 7.8, lng: 6.73 }] },
];

const R = 6371;
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Offsets a point by km east/north. */
export function offsetKm(p: GeoPoint, eastKm: number, northKm: number): GeoPoint {
  return {
    lat: p.lat + northKm / 110.574,
    lng: p.lng + eastKm / (111.32 * Math.cos((p.lat * Math.PI) / 180)),
  };
}

/** Road-ish route: unit → site with a couple of kinks. */
export function routeBetween(a: GeoPoint, b: GeoPoint, kink: number): GeoPoint[] {
  const mid1 = { lat: a.lat + (b.lat - a.lat) * 0.35 + kink * 0.004, lng: a.lng + (b.lng - a.lng) * 0.3 - kink * 0.003 };
  const mid2 = { lat: a.lat + (b.lat - a.lat) * 0.7 - kink * 0.002, lng: a.lng + (b.lng - a.lng) * 0.75 + kink * 0.004 };
  return [a, mid1, mid2, b];
}
