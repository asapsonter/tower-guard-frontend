export const ASSET_TYPES = [
  "Telecom Mast",
  "Schools",
  "Hospital",
  "Warehouse",
  "Mining Site",
  "Public Infrastructure",
  "Transport",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const NAV_PAGES = [
  { title: "Dashboard", path: "/" },
  { title: "Live Monitoring", path: "/live-monitoring" },
  { title: "Incidents", path: "/incidents" },
  { title: "Zonal Coverage", path: "/zonal-centers" },
  { title: "History", path: "/history" },
  { title: "Reports", path: "/reports" },
  { title: "National Coverage", path: "/national-coverage" },
] as const;

export const GEOPOLITICAL_ZONES = [
  "North-West",
  "North-East",
  "North-Central",
  "South-West",
  "South-East",
  "South-South",
] as const;

export const EVENT_TYPES = [
  { label: "Intruder", color: "bg-destructive text-destructive-foreground", badgeClass: "bg-destructive/20 text-destructive" },
  { label: "Tampering", color: "bg-warning text-warning-foreground", badgeClass: "bg-warning/20 text-warning" },
  { label: "Vandalism", color: "bg-purple-600 text-white", badgeClass: "bg-purple-600/20 text-purple-400" },
  { label: "Kidnapping", color: "bg-rose-700 text-white", badgeClass: "bg-rose-700/20 text-rose-400" },
  { label: "Armed", color: "bg-red-900 text-white", badgeClass: "bg-red-900/20 text-red-400" },
] as const;

export const MAST_PARAMETERS = [
  "Gate",
  "Generator",
  "Battery",
  "Tower",
  "Fence (North)",
  "Fence (East)",
  "Fence (West)",
  "Fence (South)",
] as const;

export const FIRST_RESPONDERS = [
  { id: "nscdc", name: "NSCDC", fullName: "Nigeria Security and Civil Defence Corps", icon: "🛡️" },
  { id: "police", name: "Nigerian Police Force", fullName: "Nigerian Police Force", icon: "👮" },
  { id: "army", name: "Army", fullName: "Nigerian Army", icon: "🎖️" },
  { id: "community", name: "Community Licensed Officer", fullName: "Community Licensed Officer", icon: "🏘️" },
] as const;

export const TELECOM_PROVIDERS = [
  { id: "mtn", name: "MTN Nigeria", shortName: "MTN", color: "#FFCC00" },
  { id: "glo", name: "Globacom", shortName: "GLO", color: "#00A650" },
  { id: "airtel", name: "Airtel Nigeria", shortName: "AIR", color: "#ED1C24" },
  { id: "9mobile", name: "9mobile", shortName: "9MB", color: "#006B3F" },
  // IHS Towers — independent tower company. Modelled here as a sibling
  // provider for filtering/mapping; in reality IHS leases space to the
  // four telcos above on its own masts.
  { id: "ihs", name: "IHS Towers", shortName: "IHS", color: "#6B46C1" },
] as const;

export interface TelecomMast {
  id: string;
  name: string;
  provider: string;
  providerShort: string;
  state: string;
  lga: string;
  address: string;
  lat: number;
  lng: number;
  tampered: number;
  intruders: number;
  status: "secure" | "alert" | "critical";
  towerHeight: number;
  generatorFuel: number;
  batteryCharge: number;
  lastMaintenance: string;
}

// Comprehensive telecom masts across all 36 states + FCT with realistic coordinates
export const mockTelecomMasts: TelecomMast[] = [
  // ============================================================
  // LAGOS STATE (20 masts - major metro)
  // ============================================================
  { id: "tm_001", name: "MTN Ikeja GRA Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Ikeja", address: "Obafemi Awolowo Way, Ikeja GRA", lat: 6.5833, lng: 3.3470, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 88, batteryCharge: 96, lastMaintenance: "2026-03-15" },
  { id: "tm_002", name: "GLO Victoria Island Hub", provider: "Globacom", providerShort: "GLO", state: "Lagos", lga: "Eti-Osa", address: "Adeola Odeku Street, Victoria Island", lat: 6.4281, lng: 3.4219, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 92, batteryCharge: 97, lastMaintenance: "2026-03-10" },
  { id: "tm_003", name: "Airtel Surulere Mast", provider: "Airtel Nigeria", providerShort: "AIR", state: "Lagos", lga: "Surulere", address: "Adeniran Ogunsanya Street, Surulere", lat: 6.4969, lng: 3.3567, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 58, batteryCharge: 79, lastMaintenance: "2026-02-18" },
  { id: "tm_004", name: "9mobile Lekki Phase 1 Tower", provider: "9mobile", providerShort: "9MB", state: "Lagos", lga: "Eti-Osa", address: "Admiralty Way, Lekki Phase 1", lat: 6.4380, lng: 3.4710, tampered: 0, intruders: 0, status: "secure", towerHeight: 45, generatorFuel: 85, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_005", name: "MTN Alimosho Base Station", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Alimosho", address: "LASU-Igando Road, Igando", lat: 6.5519, lng: 3.2461, tampered: 2, intruders: 3, status: "alert", towerHeight: 36, generatorFuel: 52, batteryCharge: 75, lastMaintenance: "2026-01-28" },
  { id: "tm_006", name: "GLO Ikorodu Tower", provider: "Globacom", providerShort: "GLO", state: "Lagos", lga: "Ikorodu", address: "Lagos Road, Ikorodu", lat: 6.6194, lng: 3.5105, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 91, lastMaintenance: "2026-03-05" },
  { id: "tm_007", name: "MTN Ajah Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Eti-Osa", address: "Lekki-Epe Expressway, Ajah", lat: 6.4676, lng: 3.5700, tampered: 0, intruders: 1, status: "secure", towerHeight: 42, generatorFuel: 82, batteryCharge: 95, lastMaintenance: "2026-03-08" },
  { id: "tm_008", name: "Airtel Apapa Port Mast", provider: "Airtel Nigeria", providerShort: "AIR", state: "Lagos", lga: "Apapa", address: "Wharf Road, Apapa", lat: 6.4488, lng: 3.3590, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 62, batteryCharge: 80, lastMaintenance: "2026-02-10" },
  { id: "tm_009", name: "MTN Mushin Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Mushin", address: "Agege Motor Road, Mushin", lat: 6.5306, lng: 3.3512, tampered: 3, intruders: 4, status: "critical", towerHeight: 35, generatorFuel: 28, batteryCharge: 48, lastMaintenance: "2025-11-20" },
  { id: "tm_010", name: "GLO Oshodi-Isolo Hub", provider: "Globacom", providerShort: "GLO", state: "Lagos", lga: "Oshodi-Isolo", address: "Oshodi Expressway, Oshodi", lat: 6.5569, lng: 3.3413, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 75, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_011", name: "9mobile Maryland Tower", provider: "9mobile", providerShort: "9MB", state: "Lagos", lga: "Kosofe", address: "Ikorodu Road, Maryland", lat: 6.5740, lng: 3.3678, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-02-28" },
  { id: "tm_012", name: "MTN Ogba Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Ifako-Ijaiye", address: "Ogba-Ijaiye Road, Ogba", lat: 6.6312, lng: 3.3389, tampered: 0, intruders: 1, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-02" },
  { id: "tm_013", name: "Airtel Yaba Mast", provider: "Airtel Nigeria", providerShort: "AIR", state: "Lagos", lga: "Lagos Mainland", address: "Herbert Macaulay Way, Yaba", lat: 6.5095, lng: 3.3752, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 90, batteryCharge: 96, lastMaintenance: "2026-03-14" },
  { id: "tm_014", name: "GLO Lagos Island Tower", provider: "Globacom", providerShort: "GLO", state: "Lagos", lga: "Lagos Island", address: "Broad Street, Lagos Island", lat: 6.4541, lng: 3.3947, tampered: 1, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 68, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_015", name: "MTN Festac Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Amuwo-Odofin", address: "21 Road, Festac Town", lat: 6.4658, lng: 3.2835, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 86, batteryCharge: 95, lastMaintenance: "2026-03-10" },
  { id: "tm_016", name: "Airtel Agege Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Lagos", lga: "Agege", address: "Old Abeokuta Road, Agege", lat: 6.6210, lng: 3.3270, tampered: 2, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-30" },
  { id: "tm_017", name: "GLO Badagry Tower", provider: "Globacom", providerShort: "GLO", state: "Lagos", lga: "Badagry", address: "Lagos-Badagry Expressway, Badagry", lat: 6.4153, lng: 2.8813, tampered: 1, intruders: 2, status: "alert", towerHeight: 44, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-05" },
  { id: "tm_018", name: "9mobile Epe Tower", provider: "9mobile", providerShort: "9MB", state: "Lagos", lga: "Epe", address: "Epe-Ijebu Road, Epe", lat: 6.5841, lng: 3.9832, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-06" },
  { id: "tm_019", name: "MTN Ojota Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Kosofe", address: "Ikorodu Road, Ojota", lat: 6.5862, lng: 3.3825, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 81, batteryCharge: 92, lastMaintenance: "2026-03-09" },
  { id: "tm_020", name: "Airtel Ojo Barracks Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Lagos", lga: "Ojo", address: "Ojo Road, Ojo", lat: 6.4683, lng: 3.1822, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 70, batteryCharge: 87, lastMaintenance: "2026-02-20" },

  // ============================================================
  // FCT - ABUJA (15 masts)
  // ============================================================
  { id: "tm_021", name: "MTN Maitama Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "FCT", lga: "Abuja Municipal", address: "Aguiyi Ironsi Street, Maitama", lat: 9.0827, lng: 7.4947, tampered: 0, intruders: 0, status: "secure", towerHeight: 50, generatorFuel: 95, batteryCharge: 99, lastMaintenance: "2026-03-15" },
  { id: "tm_022", name: "GLO Wuse 2 Hub", provider: "Globacom", providerShort: "GLO", state: "FCT", lga: "Abuja Municipal", address: "Aminu Kano Crescent, Wuse 2", lat: 9.0765, lng: 7.4832, tampered: 0, intruders: 0, status: "secure", towerHeight: 45, generatorFuel: 88, batteryCharge: 97, lastMaintenance: "2026-03-12" },
  { id: "tm_023", name: "Airtel Garki Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "FCT", lga: "Abuja Municipal", address: "Area 11, Garki", lat: 9.0389, lng: 7.4919, tampered: 0, intruders: 1, status: "secure", towerHeight: 48, generatorFuel: 82, batteryCharge: 95, lastMaintenance: "2026-03-08" },
  { id: "tm_024", name: "9mobile Asokoro Tower", provider: "9mobile", providerShort: "9MB", state: "FCT", lga: "Abuja Municipal", address: "Three Arms Zone, Asokoro", lat: 9.0578, lng: 7.5100, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 90, batteryCharge: 96, lastMaintenance: "2026-03-10" },
  { id: "tm_025", name: "MTN Gwarinpa Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "FCT", lga: "Abuja Municipal", address: "1st Avenue, Gwarinpa", lat: 9.1052, lng: 7.4015, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-05" },
  { id: "tm_026", name: "GLO Jabi Tower", provider: "Globacom", providerShort: "GLO", state: "FCT", lga: "Abuja Municipal", address: "Jabi Lake Mall Area, Jabi", lat: 9.0741, lng: 7.4268, tampered: 1, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_027", name: "Airtel Lugbe Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "FCT", lga: "Abuja Municipal", address: "Airport Road, Lugbe", lat: 8.9932, lng: 7.3764, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 76, lastMaintenance: "2026-02-08" },
  { id: "tm_028", name: "MTN Kubwa Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "FCT", lga: "Bwari", address: "Kubwa Phase 4, Kubwa", lat: 9.1540, lng: 7.3210, tampered: 0, intruders: 1, status: "secure", towerHeight: 42, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-02" },
  { id: "tm_029", name: "GLO Gwagwalada Tower", provider: "Globacom", providerShort: "GLO", state: "FCT", lga: "Gwagwalada", address: "Gwagwalada Market Area", lat: 8.9431, lng: 7.0838, tampered: 1, intruders: 1, status: "alert", towerHeight: 36, generatorFuel: 60, batteryCharge: 80, lastMaintenance: "2026-02-12" },
  { id: "tm_030", name: "9mobile Central Area Tower", provider: "9mobile", providerShort: "9MB", state: "FCT", lga: "Abuja Municipal", address: "Shehu Shagari Way, Central Area", lat: 9.0580, lng: 7.4891, tampered: 0, intruders: 0, status: "secure", towerHeight: 50, generatorFuel: 92, batteryCharge: 98, lastMaintenance: "2026-03-14" },
  { id: "tm_031", name: "MTN Nyanya Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "FCT", lga: "Abuja Municipal", address: "Nyanya Junction, Abuja-Keffi Road", lat: 9.0130, lng: 7.5540, tampered: 2, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-25" },
  { id: "tm_032", name: "Airtel Kuje Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "FCT", lga: "Kuje", address: "Kuje Town Center", lat: 8.8819, lng: 7.2280, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-01" },
  { id: "tm_033", name: "GLO Utako Tower", provider: "Globacom", providerShort: "GLO", state: "FCT", lga: "Abuja Municipal", address: "Utako Market Area", lat: 9.0780, lng: 7.4466, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 84, batteryCharge: 94, lastMaintenance: "2026-03-07" },
  { id: "tm_034", name: "MTN Life Camp Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "FCT", lga: "Abuja Municipal", address: "Life Camp Junction, Jabi-Life Camp Road", lat: 9.0825, lng: 7.4145, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 86, batteryCharge: 95, lastMaintenance: "2026-03-11" },
  { id: "tm_035", name: "Airtel Bwari Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "FCT", lga: "Bwari", address: "Bwari Town Center", lat: 9.2840, lng: 7.3815, tampered: 1, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },

  // ============================================================
  // KANO STATE (12 masts)
  // ============================================================
  { id: "tm_036", name: "MTN Kano Municipal Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kano", lga: "Kano Municipal", address: "Murtala Mohammed Way, Kano", lat: 12.0000, lng: 8.5167, tampered: 1, intruders: 0, status: "secure", towerHeight: 45, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-03-02" },
  { id: "tm_037", name: "Airtel Nassarawa Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kano", lga: "Nassarawa", address: "Zoo Road, Nassarawa GRA", lat: 11.9850, lng: 8.5230, tampered: 3, intruders: 5, status: "critical", towerHeight: 40, generatorFuel: 22, batteryCharge: 48, lastMaintenance: "2025-12-15" },
  { id: "tm_038", name: "GLO Fagge Hub", provider: "Globacom", providerShort: "GLO", state: "Kano", lga: "Fagge", address: "Kofar Wambai Road, Fagge", lat: 12.0105, lng: 8.5280, tampered: 0, intruders: 1, status: "secure", towerHeight: 38, generatorFuel: 68, batteryCharge: 90, lastMaintenance: "2026-02-20" },
  { id: "tm_039", name: "9mobile Tarauni Tower", provider: "9mobile", providerShort: "9MB", state: "Kano", lga: "Tarauni", address: "BUK Road, Tarauni", lat: 11.9620, lng: 8.5035, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-08" },
  { id: "tm_040", name: "MTN Gwale Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kano", lga: "Gwale", address: "Kofar Nassarawa, Gwale", lat: 11.9881, lng: 8.5190, tampered: 1, intruders: 2, status: "alert", towerHeight: 42, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-05" },
  { id: "tm_041", name: "GLO Dala Tower", provider: "Globacom", providerShort: "GLO", state: "Kano", lga: "Dala", address: "Kofar Mazugal, Dala", lat: 12.0149, lng: 8.5068, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-05" },
  { id: "tm_042", name: "Airtel Kumbotso Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kano", lga: "Kumbotso", address: "Kano-Zaria Road, Kumbotso", lat: 11.9370, lng: 8.5100, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-28" },
  { id: "tm_043", name: "MTN Ungogo Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kano", lga: "Ungogo", address: "Katsina Road, Ungogo", lat: 12.0502, lng: 8.5063, tampered: 2, intruders: 3, status: "alert", towerHeight: 44, generatorFuel: 42, batteryCharge: 68, lastMaintenance: "2026-01-18" },
  { id: "tm_044", name: "9mobile Bichi Tower", provider: "9mobile", providerShort: "9MB", state: "Kano", lga: "Bichi", address: "Kano-Katsina Highway, Bichi", lat: 12.2339, lng: 8.2453, tampered: 1, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 65, batteryCharge: 85, lastMaintenance: "2026-02-15" },
  { id: "tm_045", name: "GLO Wudil Tower", provider: "Globacom", providerShort: "GLO", state: "Kano", lga: "Wudil", address: "Kano-Maiduguri Road, Wudil", lat: 11.8108, lng: 8.8498, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-10" },
  { id: "tm_046", name: "MTN Dambatta Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kano", lga: "Dambatta", address: "Kano-Kazaure Road, Dambatta", lat: 12.4266, lng: 8.5153, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 50, batteryCharge: 74, lastMaintenance: "2026-02-01" },
  { id: "tm_047", name: "Airtel Gaya Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kano", lga: "Gaya", address: "Kano-Zaria Road, Gaya", lat: 11.8612, lng: 9.0024, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-03" },

  // ============================================================
  // RIVERS STATE - PORT HARCOURT (10 masts)
  // ============================================================
  { id: "tm_048", name: "MTN Port Harcourt GRA Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Rivers", lga: "Port Harcourt", address: "Aba Road, GRA Phase 2", lat: 4.8156, lng: 7.0498, tampered: 0, intruders: 1, status: "secure", towerHeight: 42, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },
  { id: "tm_049", name: "Airtel Obio-Akpor Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Rivers", lga: "Obio-Akpor", address: "Ada George Road, Rumueme", lat: 4.8598, lng: 6.9922, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 75, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_050", name: "GLO Eleme Tower", provider: "Globacom", providerShort: "GLO", state: "Rivers", lga: "Eleme", address: "East-West Road, Eleme Junction", lat: 4.7730, lng: 7.1056, tampered: 2, intruders: 3, status: "alert", towerHeight: 38, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-30" },
  { id: "tm_051", name: "9mobile Trans Amadi Tower", provider: "9mobile", providerShort: "9MB", state: "Rivers", lga: "Port Harcourt", address: "Trans Amadi Industrial Layout", lat: 4.8020, lng: 7.0380, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 85, batteryCharge: 95, lastMaintenance: "2026-03-12" },
  { id: "tm_052", name: "MTN Choba Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Rivers", lga: "Obio-Akpor", address: "East-West Road, Choba", lat: 4.8822, lng: 6.9187, tampered: 3, intruders: 5, status: "critical", towerHeight: 36, generatorFuel: 25, batteryCharge: 45, lastMaintenance: "2025-11-10" },
  { id: "tm_053", name: "GLO Rumuokoro Tower", provider: "Globacom", providerShort: "GLO", state: "Rivers", lga: "Obio-Akpor", address: "Ikwerre Road, Rumuokoro", lat: 4.8650, lng: 7.0020, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_054", name: "Airtel Oyigbo Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Rivers", lga: "Oyigbo", address: "Aba-Port Harcourt Road, Oyigbo", lat: 4.8766, lng: 7.1544, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 56, batteryCharge: 77, lastMaintenance: "2026-02-10" },
  { id: "tm_055", name: "MTN Bonny Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Rivers", lga: "Bonny", address: "Bonny Island Town", lat: 4.4388, lng: 7.1672, tampered: 1, intruders: 1, status: "alert", towerHeight: 44, generatorFuel: 60, batteryCharge: 82, lastMaintenance: "2026-02-15" },
  { id: "tm_056", name: "GLO Ahoada Tower", provider: "Globacom", providerShort: "GLO", state: "Rivers", lga: "Ahoada East", address: "East-West Road, Ahoada", lat: 5.0780, lng: 6.6495, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-03-01" },
  { id: "tm_057", name: "9mobile Degema Tower", provider: "9mobile", providerShort: "9MB", state: "Rivers", lga: "Degema", address: "Degema Town Center", lat: 4.7446, lng: 6.7676, tampered: 1, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 66, batteryCharge: 84, lastMaintenance: "2026-02-20" },

  // ============================================================
  // OYO STATE - IBADAN (10 masts)
  // ============================================================
  { id: "tm_058", name: "MTN Bodija Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Oyo", lga: "Ibadan North", address: "Bodija Road, UI Area", lat: 7.4165, lng: 3.9096, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_059", name: "GLO Ring Road Tower", provider: "Globacom", providerShort: "GLO", state: "Oyo", lga: "Ibadan South-West", address: "Ring Road, Ibadan", lat: 7.3716, lng: 3.8901, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-05" },
  { id: "tm_060", name: "Airtel Challenge Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Oyo", lga: "Ibadan South-East", address: "Challenge Area, Ibadan", lat: 7.3572, lng: 3.8744, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_061", name: "9mobile Dugbe Tower", provider: "9mobile", providerShort: "9MB", state: "Oyo", lga: "Ibadan North-West", address: "Dugbe Market Area", lat: 7.3911, lng: 3.8789, tampered: 0, intruders: 1, status: "secure", towerHeight: 36, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_062", name: "MTN Mokola Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Oyo", lga: "Ibadan North", address: "Mokola Hill, Ibadan", lat: 7.4004, lng: 3.8946, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 85, batteryCharge: 95, lastMaintenance: "2026-03-14" },
  { id: "tm_063", name: "GLO Ogbomoso Tower", provider: "Globacom", providerShort: "GLO", state: "Oyo", lga: "Ogbomoso North", address: "Ilorin Road, Ogbomoso", lat: 8.1337, lng: 4.2491, tampered: 1, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-22" },
  { id: "tm_064", name: "Airtel Oyo Town Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Oyo", lga: "Oyo West", address: "Awe Road, Oyo Town", lat: 7.8508, lng: 3.9334, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_065", name: "MTN Iseyin Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Oyo", lga: "Iseyin", address: "Oyo-Iseyin Road, Iseyin", lat: 7.9725, lng: 3.5940, tampered: 1, intruders: 1, status: "alert", towerHeight: 40, generatorFuel: 58, batteryCharge: 80, lastMaintenance: "2026-02-10" },
  { id: "tm_066", name: "GLO Saki Tower", provider: "Globacom", providerShort: "GLO", state: "Oyo", lga: "Saki West", address: "Saki Town Center", lat: 8.6679, lng: 3.3940, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-05" },
  { id: "tm_067", name: "9mobile Oluyole Tower", provider: "9mobile", providerShort: "9MB", state: "Oyo", lga: "Oluyole", address: "Oluyole Industrial Estate", lat: 7.3310, lng: 3.8580, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },

  // ============================================================
  // KADUNA STATE (10 masts - higher alert/critical)
  // ============================================================
  { id: "tm_068", name: "MTN Kaduna North Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kaduna", lga: "Kaduna North", address: "Ahmadu Bello Way, Kaduna", lat: 10.5222, lng: 7.4340, tampered: 5, intruders: 8, status: "critical", towerHeight: 45, generatorFuel: 18, batteryCharge: 42, lastMaintenance: "2025-10-30" },
  { id: "tm_069", name: "Airtel Zaria Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kaduna", lga: "Zaria", address: "Sokoto Road, Sabon Gari Zaria", lat: 11.0765, lng: 7.7109, tampered: 2, intruders: 3, status: "alert", towerHeight: 42, generatorFuel: 45, batteryCharge: 72, lastMaintenance: "2026-01-15" },
  { id: "tm_070", name: "GLO Kaduna South Hub", provider: "Globacom", providerShort: "GLO", state: "Kaduna", lga: "Kaduna South", address: "Kawo-Narayi Road, Kaduna South", lat: 10.4839, lng: 7.4106, tampered: 3, intruders: 4, status: "critical", towerHeight: 40, generatorFuel: 15, batteryCharge: 38, lastMaintenance: "2025-11-20" },
  { id: "tm_071", name: "9mobile Barnawa Tower", provider: "9mobile", providerShort: "9MB", state: "Kaduna", lga: "Kaduna South", address: "Barnawa, Kaduna South", lat: 10.4705, lng: 7.4298, tampered: 2, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 48, batteryCharge: 74, lastMaintenance: "2026-01-28" },
  { id: "tm_072", name: "MTN Rigasa Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kaduna", lga: "Igabi", address: "Kaduna-Abuja Road, Rigasa", lat: 10.5360, lng: 7.3811, tampered: 4, intruders: 6, status: "critical", towerHeight: 42, generatorFuel: 20, batteryCharge: 45, lastMaintenance: "2025-12-05" },
  { id: "tm_073", name: "Airtel Kafanchan Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kaduna", lga: "Jema'a", address: "Kafanchan Town", lat: 9.5836, lng: 8.2898, tampered: 3, intruders: 5, status: "critical", towerHeight: 40, generatorFuel: 28, batteryCharge: 50, lastMaintenance: "2025-12-20" },
  { id: "tm_074", name: "GLO Kakuri Tower", provider: "Globacom", providerShort: "GLO", state: "Kaduna", lga: "Kaduna South", address: "Kakuri Industrial Area", lat: 10.4600, lng: 7.4480, tampered: 1, intruders: 2, status: "alert", towerHeight: 36, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-01" },
  { id: "tm_075", name: "MTN Sabon Tasha Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kaduna", lga: "Chikun", address: "Abuja-Kaduna Expressway, Sabon Tasha", lat: 10.4418, lng: 7.4164, tampered: 1, intruders: 1, status: "alert", towerHeight: 44, generatorFuel: 58, batteryCharge: 80, lastMaintenance: "2026-02-08" },
  { id: "tm_076", name: "9mobile ABU Zaria Tower", provider: "9mobile", providerShort: "9MB", state: "Kaduna", lga: "Sabon Gari", address: "ABU Main Campus, Zaria", lat: 11.1521, lng: 7.6528, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-02-28" },
  { id: "tm_077", name: "Airtel Birnin Gwari Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kaduna", lga: "Birnin Gwari", address: "Birnin Gwari Town", lat: 10.7316, lng: 6.5113, tampered: 5, intruders: 7, status: "critical", towerHeight: 42, generatorFuel: 12, batteryCharge: 32, lastMaintenance: "2025-09-15" },

  // ============================================================
  // ENUGU STATE (8 masts)
  // ============================================================
  { id: "tm_078", name: "MTN Enugu GRA Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Enugu", lga: "Enugu North", address: "Ogui Road, GRA Enugu", lat: 6.4622, lng: 7.5025, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 85, batteryCharge: 95, lastMaintenance: "2026-03-10" },
  { id: "tm_079", name: "GLO Nsukka Tower", provider: "Globacom", providerShort: "GLO", state: "Enugu", lga: "Nsukka", address: "UNN Campus Road, Nsukka", lat: 6.8571, lng: 7.3944, tampered: 1, intruders: 1, status: "alert", towerHeight: 36, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-12" },
  { id: "tm_080", name: "Airtel New Haven Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Enugu", lga: "Enugu East", address: "New Haven Layout, Enugu", lat: 6.4435, lng: 7.5178, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-05" },
  { id: "tm_081", name: "9mobile Independence Layout Tower", provider: "9mobile", providerShort: "9MB", state: "Enugu", lga: "Enugu North", address: "Independence Layout, Enugu", lat: 6.4706, lng: 7.4920, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-08" },
  { id: "tm_082", name: "MTN Agbani Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Enugu", lga: "Nkanu West", address: "Agbani Road, Enugu", lat: 6.3886, lng: 7.5281, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_083", name: "GLO Emene Tower", provider: "Globacom", providerShort: "GLO", state: "Enugu", lga: "Enugu East", address: "Emene Industrial Layout", lat: 6.4594, lng: 7.5694, tampered: 0, intruders: 1, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_084", name: "Airtel 9th Mile Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Enugu", lga: "Udi", address: "Enugu-Onitsha Expressway, 9th Mile", lat: 6.4222, lng: 7.3806, tampered: 1, intruders: 2, status: "alert", towerHeight: 42, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-01-20" },
  { id: "tm_085", name: "MTN Oji River Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Enugu", lga: "Oji River", address: "Oji River Town", lat: 6.2649, lng: 7.2806, tampered: 0, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },

  // ============================================================
  // EDO STATE - BENIN CITY (8 masts)
  // ============================================================
  { id: "tm_086", name: "MTN Benin GRA Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Edo", lga: "Oredo", address: "Akpakpava Road, GRA Benin", lat: 6.3350, lng: 5.6271, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_087", name: "GLO Ring Road Tower", provider: "Globacom", providerShort: "GLO", state: "Edo", lga: "Oredo", address: "Ring Road, Benin City", lat: 6.3395, lng: 5.6180, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-05" },
  { id: "tm_088", name: "Airtel Uselu Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Edo", lga: "Egor", address: "Uselu-Lagos Road, Benin", lat: 6.3605, lng: 5.5979, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_089", name: "9mobile Sapele Road Tower", provider: "9mobile", providerShort: "9MB", state: "Edo", lga: "Oredo", address: "Sapele Road, Benin City", lat: 6.3298, lng: 5.6088, tampered: 0, intruders: 1, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_090", name: "MTN Ikpoba Hill Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Edo", lga: "Ikpoba-Okha", address: "Ikpoba Hill, Benin", lat: 6.3082, lng: 5.6488, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 48, batteryCharge: 74, lastMaintenance: "2026-01-28" },
  { id: "tm_091", name: "GLO Auchi Tower", provider: "Globacom", providerShort: "GLO", state: "Edo", lga: "Etsako West", address: "Auchi-Igarra Road, Auchi", lat: 7.0677, lng: 6.2614, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-22" },
  { id: "tm_092", name: "Airtel Ekpoma Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Edo", lga: "Esan West", address: "Benin-Auchi Road, Ekpoma", lat: 6.7419, lng: 6.1390, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 66, batteryCharge: 85, lastMaintenance: "2026-02-15" },
  { id: "tm_093", name: "MTN Oluku Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Edo", lga: "Ovia North-East", address: "Benin-Ore Expressway, Oluku", lat: 6.3916, lng: 5.5541, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-05" },

  // ============================================================
  // DELTA STATE - WARRI / ASABA (8 masts)
  // ============================================================
  { id: "tm_094", name: "MTN Warri Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Delta", lga: "Warri South", address: "Effurun-Sapele Road, Warri", lat: 5.5168, lng: 5.7560, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 58, batteryCharge: 80, lastMaintenance: "2026-02-10" },
  { id: "tm_095", name: "GLO Asaba Tower", provider: "Globacom", providerShort: "GLO", state: "Delta", lga: "Oshimili South", address: "Nnebisi Road, Asaba", lat: 6.1960, lng: 6.7335, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-05" },
  { id: "tm_096", name: "Airtel Effurun Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Delta", lga: "Uvwie", address: "Effurun Roundabout, Effurun", lat: 5.5600, lng: 5.7893, tampered: 0, intruders: 1, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-02-28" },
  { id: "tm_097", name: "9mobile Sapele Tower", provider: "9mobile", providerShort: "9MB", state: "Delta", lga: "Sapele", address: "Sapele Town Center", lat: 5.8906, lng: 5.6800, tampered: 0, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-03-01" },
  { id: "tm_098", name: "MTN Ughelli Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Delta", lga: "Ughelli North", address: "Ughelli-Warri Road", lat: 5.4957, lng: 5.9920, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 50, batteryCharge: 76, lastMaintenance: "2026-01-25" },
  { id: "tm_099", name: "GLO Agbor Tower", provider: "Globacom", providerShort: "GLO", state: "Delta", lga: "Ika South", address: "Benin-Asaba Road, Agbor", lat: 6.2538, lng: 6.1940, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-08" },
  { id: "tm_100", name: "Airtel Ozoro Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Delta", lga: "Isoko North", address: "Ozoro Town", lat: 5.5472, lng: 6.2281, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 65, batteryCharge: 84, lastMaintenance: "2026-02-18" },
  { id: "tm_101", name: "MTN Oleh Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Delta", lga: "Isoko South", address: "Oleh Town Center", lat: 5.4654, lng: 6.2019, tampered: 0, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 70, batteryCharge: 87, lastMaintenance: "2026-02-22" },

  // ============================================================
  // BORNO STATE (8 masts - high critical rate)
  // ============================================================
  { id: "tm_102", name: "Airtel Maiduguri Central Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Borno", lga: "Maiduguri", address: "Sir Kashim Ibrahim Road, Maiduguri", lat: 11.8311, lng: 13.1510, tampered: 7, intruders: 10, status: "critical", towerHeight: 45, generatorFuel: 12, batteryCharge: 35, lastMaintenance: "2025-09-20" },
  { id: "tm_103", name: "MTN Jere Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Borno", lga: "Jere", address: "Baga Road, Jere", lat: 11.8666, lng: 13.1048, tampered: 5, intruders: 8, status: "critical", towerHeight: 42, generatorFuel: 10, batteryCharge: 30, lastMaintenance: "2025-09-10" },
  { id: "tm_104", name: "GLO Maiduguri GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Borno", lga: "Maiduguri", address: "GRA, Maiduguri", lat: 11.8450, lng: 13.1601, tampered: 3, intruders: 4, status: "critical", towerHeight: 40, generatorFuel: 20, batteryCharge: 42, lastMaintenance: "2025-11-05" },
  { id: "tm_105", name: "9mobile Bama Road Tower", provider: "9mobile", providerShort: "9MB", state: "Borno", lga: "Maiduguri", address: "Bama Road, Maiduguri", lat: 11.8192, lng: 13.1342, tampered: 4, intruders: 6, status: "critical", towerHeight: 38, generatorFuel: 15, batteryCharge: 38, lastMaintenance: "2025-10-15" },
  { id: "tm_106", name: "MTN Biu Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Borno", lga: "Biu", address: "Biu Town Center", lat: 10.6112, lng: 12.1946, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 42, batteryCharge: 68, lastMaintenance: "2026-01-10" },
  { id: "tm_107", name: "Airtel Konduga Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Borno", lga: "Konduga", address: "Maiduguri-Bama Road, Konduga", lat: 11.6520, lng: 13.2680, tampered: 6, intruders: 9, status: "critical", towerHeight: 42, generatorFuel: 14, batteryCharge: 32, lastMaintenance: "2025-09-25" },
  { id: "tm_108", name: "GLO Damboa Tower", provider: "Globacom", providerShort: "GLO", state: "Borno", lga: "Damboa", address: "Damboa Town", lat: 11.1535, lng: 12.7551, tampered: 4, intruders: 5, status: "critical", towerHeight: 38, generatorFuel: 18, batteryCharge: 40, lastMaintenance: "2025-10-20" },
  { id: "tm_109", name: "MTN Dikwa Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Borno", lga: "Dikwa", address: "Dikwa Town", lat: 12.0327, lng: 13.9203, tampered: 3, intruders: 4, status: "alert", towerHeight: 40, generatorFuel: 38, batteryCharge: 60, lastMaintenance: "2026-01-05" },

  // ============================================================
  // OGUN STATE - ABEOKUTA (8 masts)
  // ============================================================
  { id: "tm_110", name: "Airtel Abeokuta Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Ogun", lga: "Abeokuta South", address: "Ibara GRA, Abeokuta", lat: 7.1580, lng: 3.3510, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_111", name: "MTN Ota Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ogun", lga: "Ado-Odo/Ota", address: "Lagos-Abeokuta Expressway, Ota", lat: 6.6830, lng: 3.2340, tampered: 0, intruders: 1, status: "secure", towerHeight: 42, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },
  { id: "tm_112", name: "GLO Sagamu Tower", provider: "Globacom", providerShort: "GLO", state: "Ogun", lga: "Sagamu", address: "Sagamu Interchange Area", lat: 6.8382, lng: 3.6487, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_113", name: "9mobile Ijebu Ode Tower", provider: "9mobile", providerShort: "9MB", state: "Ogun", lga: "Ijebu Ode", address: "Ibadan Road, Ijebu Ode", lat: 6.8185, lng: 3.9213, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_114", name: "MTN Sango Ota Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ogun", lga: "Ado-Odo/Ota", address: "Sango-Ota Junction", lat: 6.7060, lng: 3.2641, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 55, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_115", name: "Airtel Ilaro Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Ogun", lga: "Egbado South", address: "Ilaro Town Center", lat: 6.8872, lng: 3.0122, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_116", name: "GLO Ifo Tower", provider: "Globacom", providerShort: "GLO", state: "Ogun", lga: "Ifo", address: "Lagos-Abeokuta Road, Ifo", lat: 6.8070, lng: 3.1924, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-02" },
  { id: "tm_117", name: "MTN Odeda Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ogun", lga: "Odeda", address: "Abeokuta-Ibadan Road, Odeda", lat: 7.2295, lng: 3.5240, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },

  // ============================================================
  // ONDO STATE - AKURE (6 masts)
  // ============================================================
  { id: "tm_118", name: "MTN Akure Alagbaka Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ondo", lga: "Akure South", address: "Alagbaka GRA, Akure", lat: 7.2526, lng: 5.1950, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_119", name: "GLO Ondo Town Tower", provider: "Globacom", providerShort: "GLO", state: "Ondo", lga: "Ondo West", address: "Yaba Road, Ondo Town", lat: 7.0940, lng: 4.8350, tampered: 0, intruders: 1, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_120", name: "Airtel Owo Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Ondo", lga: "Owo", address: "Ikare Road, Owo", lat: 7.1963, lng: 5.5867, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_121", name: "9mobile Okitipupa Tower", provider: "9mobile", providerShort: "9MB", state: "Ondo", lga: "Okitipupa", address: "Okitipupa Town Center", lat: 6.5035, lng: 4.7808, tampered: 1, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 66, batteryCharge: 84, lastMaintenance: "2026-02-18" },
  { id: "tm_122", name: "MTN FUTA Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ondo", lga: "Akure South", address: "FUTA Road, Akure", lat: 7.2994, lng: 5.1442, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-08" },
  { id: "tm_123", name: "Airtel Ikare Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Ondo", lga: "Akoko North-East", address: "Ikare-Akoko Town", lat: 7.5276, lng: 5.6604, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 52, batteryCharge: 74, lastMaintenance: "2026-01-30" },

  // ============================================================
  // ABIA STATE (6 masts)
  // ============================================================
  { id: "tm_124", name: "MTN Umuahia Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Abia", lga: "Umuahia North", address: "Aba Road, Umuahia", lat: 5.5264, lng: 7.4895, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 80, batteryCharge: 92, lastMaintenance: "2026-03-05" },
  { id: "tm_125", name: "GLO Aba Tower", provider: "Globacom", providerShort: "GLO", state: "Abia", lga: "Aba South", address: "Port Harcourt Road, Aba", lat: 5.1067, lng: 7.3666, tampered: 2, intruders: 3, status: "alert", towerHeight: 36, generatorFuel: 45, batteryCharge: 72, lastMaintenance: "2026-01-15" },
  { id: "tm_126", name: "Airtel Aba North Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Abia", lga: "Aba North", address: "Ehi Road, Aba", lat: 5.1225, lng: 7.3501, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_127", name: "9mobile Ohafia Tower", provider: "9mobile", providerShort: "9MB", state: "Abia", lga: "Ohafia", address: "Ohafia Town Center", lat: 5.6164, lng: 7.8338, tampered: 0, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_128", name: "MTN Arochukwu Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Abia", lga: "Arochukwu", address: "Arochukwu Town", lat: 5.3862, lng: 7.9120, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_129", name: "GLO Osisioma Tower", provider: "Globacom", providerShort: "GLO", state: "Abia", lga: "Osisioma", address: "Aba-Owerri Road, Osisioma", lat: 5.1430, lng: 7.3220, tampered: 1, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-15" },

  // ============================================================
  // ADAMAWA STATE (6 masts)
  // ============================================================
  { id: "tm_130", name: "MTN Yola Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Adamawa", lga: "Yola North", address: "Atiku Abubakar Way, Jimeta", lat: 9.2332, lng: 12.4600, tampered: 2, intruders: 3, status: "alert", towerHeight: 42, generatorFuel: 48, batteryCharge: 74, lastMaintenance: "2026-01-25" },
  { id: "tm_131", name: "GLO Jimeta Tower", provider: "Globacom", providerShort: "GLO", state: "Adamawa", lga: "Yola North", address: "Jimeta Market Area", lat: 9.2510, lng: 12.4513, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_132", name: "Airtel Mubi Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Adamawa", lga: "Mubi North", address: "Mubi Town Center", lat: 10.2664, lng: 13.2665, tampered: 3, intruders: 4, status: "critical", towerHeight: 40, generatorFuel: 22, batteryCharge: 45, lastMaintenance: "2025-11-20" },
  { id: "tm_133", name: "9mobile Numan Tower", provider: "9mobile", providerShort: "9MB", state: "Adamawa", lga: "Numan", address: "Numan Town", lat: 9.4630, lng: 12.0386, tampered: 1, intruders: 1, status: "alert", towerHeight: 36, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-10" },
  { id: "tm_134", name: "MTN Ganye Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Adamawa", lga: "Ganye", address: "Ganye Town", lat: 8.4350, lng: 12.0530, tampered: 2, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 45, batteryCharge: 70, lastMaintenance: "2026-01-15" },
  { id: "tm_135", name: "Airtel Yola South Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Adamawa", lga: "Yola South", address: "Yola Town", lat: 9.2090, lng: 12.4810, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-25" },

  // ============================================================
  // AKWA IBOM STATE - UYO (7 masts)
  // ============================================================
  { id: "tm_136", name: "Airtel Uyo Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Akwa Ibom", lga: "Uyo", address: "Ikot Ekpene Road, Uyo", lat: 5.0408, lng: 7.9266, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_137", name: "MTN Eket Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Akwa Ibom", lga: "Eket", address: "Eket Town Center", lat: 4.6422, lng: 7.9252, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_138", name: "GLO Ikot Ekpene Tower", provider: "Globacom", providerShort: "GLO", state: "Akwa Ibom", lga: "Ikot Ekpene", address: "Ikot Ekpene Town", lat: 5.1832, lng: 7.7167, tampered: 1, intruders: 1, status: "alert", towerHeight: 36, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-10" },
  { id: "tm_139", name: "9mobile Oron Tower", provider: "9mobile", providerShort: "9MB", state: "Akwa Ibom", lga: "Oron", address: "Oron Town", lat: 4.8307, lng: 8.2373, tampered: 0, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_140", name: "MTN Abak Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Akwa Ibom", lga: "Abak", address: "Abak Town", lat: 5.0083, lng: 7.7821, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_141", name: "Airtel Ibeno Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Akwa Ibom", lga: "Ibeno", address: "Ibeno Coastal Area", lat: 4.5706, lng: 7.9845, tampered: 1, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 66, batteryCharge: 84, lastMaintenance: "2026-02-18" },
  { id: "tm_142", name: "GLO Uyo GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Akwa Ibom", lga: "Uyo", address: "Ewet Housing Estate, Uyo", lat: 5.0190, lng: 7.9540, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },

  // ============================================================
  // ANAMBRA STATE (7 masts)
  // ============================================================
  { id: "tm_143", name: "MTN Awka Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Anambra", lga: "Awka South", address: "Enugu-Onitsha Expressway, Awka", lat: 6.2105, lng: 7.0722, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_144", name: "GLO Onitsha Tower", provider: "Globacom", providerShort: "GLO", state: "Anambra", lga: "Onitsha North", address: "New Market Road, Onitsha", lat: 6.1460, lng: 6.7851, tampered: 2, intruders: 3, status: "alert", towerHeight: 38, generatorFuel: 48, batteryCharge: 74, lastMaintenance: "2026-01-20" },
  { id: "tm_145", name: "Airtel Nnewi Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Anambra", lga: "Nnewi North", address: "Nkwo Nnewi, Nnewi", lat: 6.0185, lng: 6.9173, tampered: 0, intruders: 1, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_146", name: "9mobile Ihiala Tower", provider: "9mobile", providerShort: "9MB", state: "Anambra", lga: "Ihiala", address: "Ihiala Town", lat: 5.8576, lng: 6.8584, tampered: 0, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_147", name: "MTN Onitsha South Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Anambra", lga: "Onitsha South", address: "Fegge, Onitsha", lat: 6.1336, lng: 6.7767, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_148", name: "GLO Ekwulobia Tower", provider: "Globacom", providerShort: "GLO", state: "Anambra", lga: "Aguata", address: "Ekwulobia Town", lat: 6.0399, lng: 7.0659, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_149", name: "Airtel Ogidi Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Anambra", lga: "Idemili North", address: "Ogidi Town", lat: 6.1718, lng: 6.8381, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-05" },

  // ============================================================
  // BAUCHI STATE (6 masts)
  // ============================================================
  { id: "tm_150", name: "MTN Bauchi Central Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Bauchi", lga: "Bauchi", address: "Jos Road, Bauchi", lat: 10.3100, lng: 9.8434, tampered: 1, intruders: 2, status: "alert", towerHeight: 42, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_151", name: "Airtel Azare Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Bauchi", lga: "Katagum", address: "Azare Town", lat: 11.6831, lng: 10.1899, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_152", name: "GLO Tafawa Balewa Tower", provider: "Globacom", providerShort: "GLO", state: "Bauchi", lga: "Tafawa Balewa", address: "Tafawa Balewa Town", lat: 9.7610, lng: 9.7870, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-03-01" },
  { id: "tm_153", name: "9mobile Misau Tower", provider: "9mobile", providerShort: "9MB", state: "Bauchi", lga: "Misau", address: "Misau Town", lat: 11.3160, lng: 10.4668, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 65, batteryCharge: 84, lastMaintenance: "2026-02-15" },
  { id: "tm_154", name: "MTN Dass Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Bauchi", lga: "Dass", address: "Dass Town Center", lat: 10.0080, lng: 9.5158, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 45, batteryCharge: 70, lastMaintenance: "2026-01-18" },
  { id: "tm_155", name: "Airtel Ningi Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Bauchi", lga: "Ningi", address: "Ningi Town", lat: 11.1722, lng: 9.5885, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 87, lastMaintenance: "2026-02-28" },

  // ============================================================
  // BAYELSA STATE (5 masts)
  // ============================================================
  { id: "tm_156", name: "GLO Yenagoa Tower", provider: "Globacom", providerShort: "GLO", state: "Bayelsa", lga: "Yenagoa", address: "Mbiama-Yenagoa Road, Yenagoa", lat: 4.9262, lng: 6.2640, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-30" },
  { id: "tm_157", name: "MTN Yenagoa GRA Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Bayelsa", lga: "Yenagoa", address: "Oxbow Lake, Yenagoa", lat: 4.9390, lng: 6.2780, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-03-01" },
  { id: "tm_158", name: "Airtel Brass Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Bayelsa", lga: "Brass", address: "Brass Town", lat: 4.3130, lng: 6.2414, tampered: 2, intruders: 3, status: "alert", towerHeight: 44, generatorFuel: 42, batteryCharge: 68, lastMaintenance: "2026-01-15" },
  { id: "tm_159", name: "9mobile Ogbia Tower", provider: "9mobile", providerShort: "9MB", state: "Bayelsa", lga: "Ogbia", address: "Ogbia Town", lat: 4.6879, lng: 6.3178, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 66, batteryCharge: 84, lastMaintenance: "2026-02-18" },
  { id: "tm_160", name: "GLO Sagbama Tower", provider: "Globacom", providerShort: "GLO", state: "Bayelsa", lga: "Sagbama", address: "Sagbama Town", lat: 5.1538, lng: 6.2012, tampered: 0, intruders: 1, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 87, lastMaintenance: "2026-02-25" },

  // ============================================================
  // BENUE STATE (6 masts)
  // ============================================================
  { id: "tm_161", name: "MTN Makurdi Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Benue", lga: "Makurdi", address: "Kashim Ibrahim Road, Makurdi", lat: 7.7335, lng: 8.5378, tampered: 2, intruders: 3, status: "alert", towerHeight: 42, generatorFuel: 50, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_162", name: "GLO Gboko Tower", provider: "Globacom", providerShort: "GLO", state: "Benue", lga: "Gboko", address: "Gboko Town Center", lat: 7.3229, lng: 9.0035, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-03-01" },
  { id: "tm_163", name: "Airtel Otukpo Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Benue", lga: "Otukpo", address: "Otukpo Town", lat: 7.1911, lng: 8.1273, tampered: 1, intruders: 1, status: "alert", towerHeight: 40, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-12" },
  { id: "tm_164", name: "9mobile Katsina-Ala Tower", provider: "9mobile", providerShort: "9MB", state: "Benue", lga: "Katsina-Ala", address: "Katsina-Ala Town", lat: 7.1720, lng: 9.2882, tampered: 2, intruders: 2, status: "alert", towerHeight: 36, generatorFuel: 42, batteryCharge: 70, lastMaintenance: "2026-01-20" },
  { id: "tm_165", name: "MTN Makurdi North Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Benue", lga: "Makurdi", address: "Wurukum, Makurdi", lat: 7.7197, lng: 8.5143, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },
  { id: "tm_166", name: "GLO Vandeikya Tower", provider: "Globacom", providerShort: "GLO", state: "Benue", lga: "Vandeikya", address: "Vandeikya Town", lat: 7.0885, lng: 9.0698, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },

  // ============================================================
  // CROSS RIVER STATE - CALABAR (6 masts)
  // ============================================================
  { id: "tm_167", name: "Airtel Calabar Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Cross River", lga: "Calabar Municipal", address: "Marian Road, Calabar", lat: 4.9589, lng: 8.3300, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_168", name: "MTN Calabar South Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Cross River", lga: "Calabar South", address: "Watt Market Area, Calabar", lat: 4.9451, lng: 8.3218, tampered: 0, intruders: 1, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_169", name: "GLO Ikom Tower", provider: "Globacom", providerShort: "GLO", state: "Cross River", lga: "Ikom", address: "Ikom Town Center", lat: 5.9623, lng: 8.7113, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_170", name: "9mobile Ogoja Tower", provider: "9mobile", providerShort: "9MB", state: "Cross River", lga: "Ogoja", address: "Ogoja Town", lat: 6.6573, lng: 8.7994, tampered: 0, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_171", name: "Airtel Obudu Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Cross River", lga: "Obudu", address: "Obudu Town", lat: 6.6668, lng: 9.1647, tampered: 1, intruders: 1, status: "alert", towerHeight: 42, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-08" },
  { id: "tm_172", name: "MTN Odukpani Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Cross River", lga: "Odukpani", address: "Calabar-Itu Highway", lat: 5.1538, lng: 8.3343, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-01" },

  // ============================================================
  // EBONYI STATE (5 masts)
  // ============================================================
  { id: "tm_173", name: "MTN Abakaliki Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ebonyi", lga: "Abakaliki", address: "Enugu-Abakaliki Road, Abakaliki", lat: 6.3293, lng: 8.1044, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_174", name: "GLO Afikpo Tower", provider: "Globacom", providerShort: "GLO", state: "Ebonyi", lga: "Afikpo North", address: "Afikpo Town", lat: 5.8924, lng: 7.9352, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_175", name: "Airtel Onueke Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Ebonyi", lga: "Ezza South", address: "Onueke Town", lat: 6.2014, lng: 8.0410, tampered: 0, intruders: 1, status: "secure", towerHeight: 35, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-28" },
  { id: "tm_176", name: "9mobile Abakaliki New Layout", provider: "9mobile", providerShort: "9MB", state: "Ebonyi", lga: "Abakaliki", address: "Mile 50, Abakaliki", lat: 6.3165, lng: 8.1170, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_177", name: "MTN Ishielu Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ebonyi", lga: "Ishielu", address: "Ezillo Town", lat: 6.4520, lng: 7.8806, tampered: 1, intruders: 2, status: "alert", towerHeight: 36, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-01-28" },

  // ============================================================
  // EKITI STATE (5 masts)
  // ============================================================
  { id: "tm_178", name: "GLO Ado-Ekiti Tower", provider: "Globacom", providerShort: "GLO", state: "Ekiti", lga: "Ado Ekiti", address: "Fajuyi Road, Ado-Ekiti", lat: 7.6227, lng: 5.2208, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },
  { id: "tm_179", name: "MTN Ikere Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ekiti", lga: "Ikere", address: "Ikere-Ekiti Town", lat: 7.4964, lng: 5.2304, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_180", name: "Airtel Ikole Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Ekiti", lga: "Ikole", address: "Ikole-Ekiti Town", lat: 7.7898, lng: 5.5127, tampered: 1, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_181", name: "9mobile Ijero Tower", provider: "9mobile", providerShort: "9MB", state: "Ekiti", lga: "Ijero", address: "Ijero-Ekiti Town", lat: 7.8128, lng: 5.0666, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_182", name: "MTN Ado-Ekiti EKSU Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ekiti", lga: "Ado Ekiti", address: "EKSU Campus Area, Ado-Ekiti", lat: 7.6114, lng: 5.2360, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-12" },

  // ============================================================
  // GOMBE STATE (5 masts)
  // ============================================================
  { id: "tm_183", name: "Airtel Gombe Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Gombe", lga: "Gombe", address: "Bauchi Road, Gombe", lat: 10.2893, lng: 11.1674, tampered: 2, intruders: 3, status: "alert", towerHeight: 42, generatorFuel: 48, batteryCharge: 74, lastMaintenance: "2026-01-25" },
  { id: "tm_184", name: "MTN Gombe Central Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Gombe", lga: "Gombe", address: "Federal Low-Cost, Gombe", lat: 10.2780, lng: 11.1760, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-02-28" },
  { id: "tm_185", name: "GLO Kumo Tower", provider: "Globacom", providerShort: "GLO", state: "Gombe", lga: "Akko", address: "Kumo Town", lat: 10.0449, lng: 11.2140, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_186", name: "9mobile Billiri Tower", provider: "9mobile", providerShort: "9MB", state: "Gombe", lga: "Billiri", address: "Billiri Town", lat: 9.8601, lng: 11.2278, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 65, batteryCharge: 84, lastMaintenance: "2026-02-12" },
  { id: "tm_187", name: "Airtel Dukku Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Gombe", lga: "Dukku", address: "Dukku Town", lat: 10.7766, lng: 10.7700, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },

  // ============================================================
  // IMO STATE - OWERRI (7 masts)
  // ============================================================
  { id: "tm_188", name: "MTN Owerri Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Imo", lga: "Owerri Municipal", address: "Wetheral Road, Owerri", lat: 5.4836, lng: 7.0333, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-10" },
  { id: "tm_189", name: "GLO Orlu Tower", provider: "Globacom", providerShort: "GLO", state: "Imo", lga: "Orlu", address: "Orlu Town Center", lat: 5.7948, lng: 7.0350, tampered: 1, intruders: 2, status: "alert", towerHeight: 36, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-01-30" },
  { id: "tm_190", name: "Airtel Okigwe Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Imo", lga: "Okigwe", address: "Okigwe Town", lat: 5.8268, lng: 7.3478, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_191", name: "9mobile Owerri West Tower", provider: "9mobile", providerShort: "9MB", state: "Imo", lga: "Owerri West", address: "FUTO Road, Owerri", lat: 5.4520, lng: 6.9980, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_192", name: "MTN Oguta Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Imo", lga: "Oguta", address: "Oguta Town", lat: 5.7108, lng: 6.8090, tampered: 0, intruders: 1, status: "secure", towerHeight: 36, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_193", name: "GLO Owerri New Market Tower", provider: "Globacom", providerShort: "GLO", state: "Imo", lga: "Owerri Municipal", address: "New Owerri, Douglas Road", lat: 5.4930, lng: 7.0190, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-02" },
  { id: "tm_194", name: "Airtel Mbaise Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Imo", lga: "Aboh Mbaise", address: "Ahiazu-Mbaise Road", lat: 5.5410, lng: 7.1320, tampered: 1, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 66, batteryCharge: 85, lastMaintenance: "2026-02-15" },

  // ============================================================
  // JIGAWA STATE (5 masts)
  // ============================================================
  { id: "tm_195", name: "MTN Dutse Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Jigawa", lga: "Dutse", address: "Kano-Dutse Road, Dutse", lat: 11.7568, lng: 9.3383, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_196", name: "GLO Hadejia Tower", provider: "Globacom", providerShort: "GLO", state: "Jigawa", lga: "Hadejia", address: "Hadejia Town", lat: 12.4500, lng: 10.0440, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-10" },
  { id: "tm_197", name: "Airtel Gumel Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Jigawa", lga: "Gumel", address: "Gumel Town", lat: 12.6266, lng: 9.3926, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_198", name: "9mobile Birnin Kudu Tower", provider: "9mobile", providerShort: "9MB", state: "Jigawa", lga: "Birnin Kudu", address: "Birnin Kudu Town", lat: 11.4529, lng: 9.4780, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_199", name: "MTN Kazaure Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Jigawa", lga: "Kazaure", address: "Kazaure Town", lat: 12.6488, lng: 8.4131, tampered: 1, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },

  // ============================================================
  // KATSINA STATE (7 masts - higher critical rate)
  // ============================================================
  { id: "tm_200", name: "GLO Katsina Central Tower", provider: "Globacom", providerShort: "GLO", state: "Katsina", lga: "Katsina", address: "Ibrahim Babangida Way, Katsina", lat: 13.0059, lng: 7.5999, tampered: 4, intruders: 6, status: "critical", towerHeight: 42, generatorFuel: 18, batteryCharge: 40, lastMaintenance: "2025-10-25" },
  { id: "tm_201", name: "MTN Funtua Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Katsina", lga: "Funtua", address: "Funtua Town", lat: 11.5235, lng: 7.3076, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_202", name: "Airtel Daura Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Katsina", lga: "Daura", address: "Daura Town Center", lat: 13.0348, lng: 8.3207, tampered: 3, intruders: 5, status: "critical", towerHeight: 38, generatorFuel: 15, batteryCharge: 35, lastMaintenance: "2025-11-10" },
  { id: "tm_203", name: "9mobile Malumfashi Tower", provider: "9mobile", providerShort: "9MB", state: "Katsina", lga: "Malumfashi", address: "Malumfashi Town", lat: 11.7893, lng: 7.6235, tampered: 1, intruders: 1, status: "alert", towerHeight: 36, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-20" },
  { id: "tm_204", name: "MTN Katsina Batagarawa Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Katsina", lga: "Batagarawa", address: "Katsina-Jibia Road", lat: 12.9720, lng: 7.5810, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 45, batteryCharge: 70, lastMaintenance: "2026-01-28" },
  { id: "tm_205", name: "GLO Dutsin-Ma Tower", provider: "Globacom", providerShort: "GLO", state: "Katsina", lga: "Dutsin Ma", address: "Dutsin-Ma Town", lat: 12.4532, lng: 7.4967, tampered: 2, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 50, batteryCharge: 74, lastMaintenance: "2026-02-08" },
  { id: "tm_206", name: "Airtel Kankara Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Katsina", lga: "Kankara", address: "Kankara Town", lat: 11.9310, lng: 7.4131, tampered: 4, intruders: 7, status: "critical", towerHeight: 40, generatorFuel: 20, batteryCharge: 42, lastMaintenance: "2025-12-05" },

  // ============================================================
  // KEBBI STATE (5 masts)
  // ============================================================
  { id: "tm_207", name: "MTN Birnin Kebbi Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kebbi", lga: "Birnin Kebbi", address: "Sokoto Road, Birnin Kebbi", lat: 12.4539, lng: 4.1975, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_208", name: "GLO Argungu Tower", provider: "Globacom", providerShort: "GLO", state: "Kebbi", lga: "Argungu", address: "Argungu Town", lat: 12.7475, lng: 4.5248, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-28" },
  { id: "tm_209", name: "Airtel Yauri Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kebbi", lga: "Yauri", address: "Yauri Town", lat: 10.7838, lng: 4.7592, tampered: 1, intruders: 1, status: "alert", towerHeight: 36, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-10" },
  { id: "tm_210", name: "9mobile Zuru Tower", provider: "9mobile", providerShort: "9MB", state: "Kebbi", lga: "Zuru", address: "Zuru Town", lat: 11.4371, lng: 5.2291, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_211", name: "MTN Jega Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kebbi", lga: "Jega", address: "Jega Town", lat: 12.2209, lng: 4.3790, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },

  // ============================================================
  // KOGI STATE (6 masts)
  // ============================================================
  { id: "tm_212", name: "Airtel Lokoja Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kogi", lga: "Lokoja", address: "Ganaja Road, Lokoja", lat: 7.7969, lng: 6.7402, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_213", name: "MTN Okene Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kogi", lga: "Okene", address: "Okene Town Center", lat: 7.5505, lng: 6.2371, tampered: 1, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_214", name: "GLO Idah Tower", provider: "Globacom", providerShort: "GLO", state: "Kogi", lga: "Idah", address: "Idah Town", lat: 7.1103, lng: 6.7374, tampered: 0, intruders: 1, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_215", name: "9mobile Kabba Tower", provider: "9mobile", providerShort: "9MB", state: "Kogi", lga: "Kabba/Bunu", address: "Kabba Town", lat: 7.8283, lng: 6.0706, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-02-28" },
  { id: "tm_216", name: "Airtel Anyigba Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kogi", lga: "Dekina", address: "KSU Road, Anyigba", lat: 7.4909, lng: 7.1819, tampered: 1, intruders: 1, status: "alert", towerHeight: 40, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-08" },
  { id: "tm_217", name: "MTN Ajaokuta Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kogi", lga: "Ajaokuta", address: "Ajaokuta Steel Mill Road", lat: 7.5589, lng: 6.6508, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },

  // ============================================================
  // KWARA STATE - ILORIN (6 masts)
  // ============================================================
  { id: "tm_218", name: "MTN Ilorin GRA Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kwara", lga: "Ilorin West", address: "Unity Road, GRA Ilorin", lat: 8.4912, lng: 4.5418, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_219", name: "GLO Ilorin East Tower", provider: "Globacom", providerShort: "GLO", state: "Kwara", lga: "Ilorin East", address: "Fate Road, Ilorin", lat: 8.4760, lng: 4.5810, tampered: 0, intruders: 1, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_220", name: "Airtel Offa Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kwara", lga: "Offa", address: "Offa Town Center", lat: 8.1488, lng: 4.7247, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_221", name: "9mobile Ilorin South Tower", provider: "9mobile", providerShort: "9MB", state: "Kwara", lga: "Ilorin South", address: "Challenge Area, Ilorin", lat: 8.4590, lng: 4.5340, tampered: 1, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_222", name: "MTN Jebba Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kwara", lga: "Moro", address: "Jebba Town", lat: 9.1194, lng: 4.8238, tampered: 1, intruders: 1, status: "alert", towerHeight: 44, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-05" },
  { id: "tm_223", name: "GLO Omu-Aran Tower", provider: "Globacom", providerShort: "GLO", state: "Kwara", lga: "Irepodun", address: "Omu-Aran Town", lat: 8.1383, lng: 5.1013, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-05" },

  // ============================================================
  // NASARAWA STATE (5 masts)
  // ============================================================
  { id: "tm_224", name: "GLO Lafia Tower", provider: "Globacom", providerShort: "GLO", state: "Nasarawa", lga: "Lafia", address: "Jos Road, Lafia", lat: 8.4889, lng: 8.5150, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-08" },
  { id: "tm_225", name: "MTN Keffi Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Nasarawa", lga: "Keffi", address: "Abuja-Keffi Road, Keffi", lat: 8.8488, lng: 7.8730, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_226", name: "Airtel Karu Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Nasarawa", lga: "Karu", address: "Abuja-Keffi Expressway, Karu", lat: 8.9954, lng: 7.5928, tampered: 0, intruders: 1, status: "secure", towerHeight: 36, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-28" },
  { id: "tm_227", name: "9mobile Akwanga Tower", provider: "9mobile", providerShort: "9MB", state: "Nasarawa", lga: "Akwanga", address: "Akwanga Town", lat: 8.9079, lng: 8.3900, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_228", name: "MTN Nasarawa Toto Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Nasarawa", lga: "Toto", address: "Toto Town", lat: 8.3898, lng: 7.0831, tampered: 1, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },

  // ============================================================
  // NIGER STATE (6 masts)
  // ============================================================
  { id: "tm_229", name: "MTN Minna Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Niger", lga: "Chanchaga", address: "Paiko Road, Minna", lat: 9.6106, lng: 6.5485, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_230", name: "GLO Suleja Tower", provider: "Globacom", providerShort: "GLO", state: "Niger", lga: "Suleja", address: "Suleja Town Center", lat: 9.1845, lng: 7.1786, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_231", name: "Airtel Bida Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Niger", lga: "Bida", address: "Bida Town Center", lat: 9.0847, lng: 6.0100, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-10" },
  { id: "tm_232", name: "9mobile Kontagora Tower", provider: "9mobile", providerShort: "9MB", state: "Niger", lga: "Kontagora", address: "Kontagora Town", lat: 10.4041, lng: 5.4694, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_233", name: "MTN New Bussa Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Niger", lga: "Borgu", address: "Kainji Lake Area, New Bussa", lat: 9.8890, lng: 4.5166, tampered: 1, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_234", name: "GLO Minna Bosso Tower", provider: "Globacom", providerShort: "GLO", state: "Niger", lga: "Bosso", address: "Bosso Road, Minna", lat: 9.6280, lng: 6.5620, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-10" },

  // ============================================================
  // OSUN STATE (6 masts)
  // ============================================================
  { id: "tm_235", name: "GLO Osogbo Tower", provider: "Globacom", providerShort: "GLO", state: "Osun", lga: "Osogbo", address: "Gbongan Road, Osogbo", lat: 7.7706, lng: 4.5567, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-10" },
  { id: "tm_236", name: "MTN Ife Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Osun", lga: "Ife Central", address: "OAU Campus Road, Ile-Ife", lat: 7.5221, lng: 4.5258, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_237", name: "Airtel Ilesa Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Osun", lga: "Ilesa East", address: "Ilesa Town Center", lat: 7.6281, lng: 4.7408, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_238", name: "9mobile Ede Tower", provider: "9mobile", providerShort: "9MB", state: "Osun", lga: "Ede North", address: "Ede Town", lat: 7.7394, lng: 4.4394, tampered: 0, intruders: 0, status: "secure", towerHeight: 35, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_239", name: "MTN Iwo Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Osun", lga: "Iwo", address: "Iwo Town Center", lat: 7.6298, lng: 4.1828, tampered: 0, intruders: 1, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_240", name: "GLO Osogbo GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Osun", lga: "Osogbo", address: "Oke-Fia, Osogbo", lat: 7.7800, lng: 4.5410, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },

  // ============================================================
  // PLATEAU STATE - JOS (7 masts)
  // ============================================================
  { id: "tm_241", name: "MTN Jos Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Plateau", lga: "Jos North", address: "Ahmadu Bello Way, Jos", lat: 9.9285, lng: 8.8921, tampered: 2, intruders: 3, status: "alert", towerHeight: 44, generatorFuel: 48, batteryCharge: 74, lastMaintenance: "2026-01-25" },
  { id: "tm_242", name: "GLO Bukuru Tower", provider: "Globacom", providerShort: "GLO", state: "Plateau", lga: "Jos South", address: "Bukuru Town", lat: 9.7928, lng: 8.8676, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-03-01" },
  { id: "tm_243", name: "Airtel Rayfield Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Plateau", lga: "Jos South", address: "Rayfield, Jos", lat: 9.8599, lng: 8.8500, tampered: 0, intruders: 1, status: "secure", towerHeight: 42, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-05" },
  { id: "tm_244", name: "9mobile UNIJOS Tower", provider: "9mobile", providerShort: "9MB", state: "Plateau", lga: "Jos North", address: "Bauchi Road, UNIJOS Area", lat: 9.9440, lng: 8.8980, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },
  { id: "tm_245", name: "MTN Pankshin Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Plateau", lga: "Pankshin", address: "Pankshin Town", lat: 9.3261, lng: 9.4368, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 50, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_246", name: "GLO Shendam Tower", provider: "Globacom", providerShort: "GLO", state: "Plateau", lga: "Shendam", address: "Shendam Town", lat: 8.8890, lng: 9.5391, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_247", name: "Airtel Barkin Ladi Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Plateau", lga: "Barkin Ladi", address: "Barkin Ladi Town", lat: 9.5411, lng: 8.8935, tampered: 2, intruders: 3, status: "alert", towerHeight: 38, generatorFuel: 45, batteryCharge: 70, lastMaintenance: "2026-01-18" },

  // ============================================================
  // SOKOTO STATE (6 masts)
  // ============================================================
  { id: "tm_248", name: "Airtel Sokoto Central Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Sokoto", lga: "Sokoto North", address: "Sultan Abubakar Road, Sokoto", lat: 13.0622, lng: 5.2378, tampered: 2, intruders: 3, status: "alert", towerHeight: 42, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-25" },
  { id: "tm_249", name: "MTN Sokoto South Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Sokoto", lga: "Sokoto South", address: "Sokoto-Bodinga Road", lat: 13.0418, lng: 5.2210, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 88, lastMaintenance: "2026-02-28" },
  { id: "tm_250", name: "GLO Tambuwal Tower", provider: "Globacom", providerShort: "GLO", state: "Sokoto", lga: "Tambuwal", address: "Tambuwal Town", lat: 12.4029, lng: 4.6452, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-08" },
  { id: "tm_251", name: "9mobile Wamako Tower", provider: "9mobile", providerShort: "9MB", state: "Sokoto", lga: "Wamako", address: "UDUS Area, Wamako", lat: 13.0780, lng: 5.2040, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_252", name: "MTN Illela Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Sokoto", lga: "Illela", address: "Sokoto-Illela Road", lat: 13.7291, lng: 5.2988, tampered: 3, intruders: 4, status: "critical", towerHeight: 42, generatorFuel: 22, batteryCharge: 45, lastMaintenance: "2025-12-10" },
  { id: "tm_253", name: "Airtel Gwadabawa Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Sokoto", lga: "Gwadabawa", address: "Gwadabawa Town", lat: 13.3538, lng: 5.2370, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-12" },

  // ============================================================
  // TARABA STATE (6 masts)
  // ============================================================
  { id: "tm_254", name: "MTN Jalingo Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Taraba", lga: "Jalingo", address: "Hammaruwa Way, Jalingo", lat: 8.8933, lng: 11.3559, tampered: 2, intruders: 3, status: "alert", towerHeight: 42, generatorFuel: 48, batteryCharge: 74, lastMaintenance: "2026-01-28" },
  { id: "tm_255", name: "GLO Wukari Tower", provider: "Globacom", providerShort: "GLO", state: "Taraba", lga: "Wukari", address: "Wukari Town", lat: 7.8510, lng: 9.7760, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_256", name: "Airtel Bali Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Taraba", lga: "Bali", address: "Bali Town", lat: 7.8508, lng: 10.9608, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },
  { id: "tm_257", name: "9mobile Takum Tower", provider: "9mobile", providerShort: "9MB", state: "Taraba", lga: "Takum", address: "Takum Town", lat: 7.2640, lng: 9.9975, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 65, batteryCharge: 84, lastMaintenance: "2026-02-15" },
  { id: "tm_258", name: "MTN Gembu Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Taraba", lga: "Sardauna", address: "Gembu Town", lat: 6.7081, lng: 11.2553, tampered: 2, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 42, batteryCharge: 68, lastMaintenance: "2026-01-15" },
  { id: "tm_259", name: "GLO Jalingo GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Taraba", lga: "Jalingo", address: "Jalingo GRA Area", lat: 8.9050, lng: 11.3640, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },

  // ============================================================
  // YOBE STATE (6 masts - high critical rate)
  // ============================================================
  { id: "tm_260", name: "GLO Damaturu Tower", provider: "Globacom", providerShort: "GLO", state: "Yobe", lga: "Damaturu", address: "Maiduguri Road, Damaturu", lat: 11.7470, lng: 11.9610, tampered: 4, intruders: 6, status: "critical", towerHeight: 42, generatorFuel: 15, batteryCharge: 38, lastMaintenance: "2025-10-15" },
  { id: "tm_261", name: "MTN Potiskum Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Yobe", lga: "Potiskum", address: "Potiskum Town Center", lat: 11.7119, lng: 11.0808, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 45, batteryCharge: 70, lastMaintenance: "2026-01-20" },
  { id: "tm_262", name: "Airtel Nguru Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Yobe", lga: "Nguru", address: "Nguru Town", lat: 12.8790, lng: 10.4540, tampered: 3, intruders: 5, status: "critical", towerHeight: 38, generatorFuel: 18, batteryCharge: 40, lastMaintenance: "2025-11-10" },
  { id: "tm_263", name: "9mobile Gashua Tower", provider: "9mobile", providerShort: "9MB", state: "Yobe", lga: "Bade", address: "Gashua Town", lat: 12.8715, lng: 11.0435, tampered: 2, intruders: 2, status: "alert", towerHeight: 36, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-28" },
  { id: "tm_264", name: "MTN Geidam Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Yobe", lga: "Geidam", address: "Geidam Town", lat: 12.8990, lng: 11.9270, tampered: 5, intruders: 7, status: "critical", towerHeight: 40, generatorFuel: 12, batteryCharge: 32, lastMaintenance: "2025-09-25" },
  { id: "tm_265", name: "GLO Damaturu GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Yobe", lga: "Damaturu", address: "GRA, Damaturu", lat: 11.7530, lng: 11.9670, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 50, batteryCharge: 74, lastMaintenance: "2026-02-05" },

  // ============================================================
  // ZAMFARA STATE (6 masts - high critical rate)
  // ============================================================
  { id: "tm_266", name: "MTN Gusau Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Zamfara", lga: "Gusau", address: "Sokoto Road, Gusau", lat: 12.1704, lng: 6.6610, tampered: 5, intruders: 8, status: "critical", towerHeight: 42, generatorFuel: 18, batteryCharge: 42, lastMaintenance: "2025-11-01" },
  { id: "tm_267", name: "GLO Kaura Namoda Tower", provider: "Globacom", providerShort: "GLO", state: "Zamfara", lga: "Kaura Namoda", address: "Kaura Namoda Town", lat: 12.5929, lng: 6.5869, tampered: 3, intruders: 4, status: "critical", towerHeight: 40, generatorFuel: 15, batteryCharge: 38, lastMaintenance: "2025-10-20" },
  { id: "tm_268", name: "Airtel Talata Mafara Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Zamfara", lga: "Talata Mafara", address: "Talata Mafara Town", lat: 12.5685, lng: 6.0668, tampered: 2, intruders: 3, status: "alert", towerHeight: 38, generatorFuel: 45, batteryCharge: 70, lastMaintenance: "2026-01-15" },
  { id: "tm_269", name: "9mobile Anka Tower", provider: "9mobile", providerShort: "9MB", state: "Zamfara", lga: "Anka", address: "Anka Town", lat: 12.1108, lng: 5.9262, tampered: 4, intruders: 5, status: "critical", towerHeight: 36, generatorFuel: 20, batteryCharge: 42, lastMaintenance: "2025-12-05" },
  { id: "tm_270", name: "MTN Gusau Central Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Zamfara", lga: "Gusau", address: "Canteen Area, Gusau", lat: 12.1620, lng: 6.6530, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-28" },
  { id: "tm_271", name: "Airtel Tsafe Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Zamfara", lga: "Tsafe", address: "Tsafe Town", lat: 12.1613, lng: 7.0895, tampered: 3, intruders: 4, status: "critical", towerHeight: 38, generatorFuel: 14, batteryCharge: 35, lastMaintenance: "2025-10-10" },

  // ============================================================
  // ADDITIONAL STATE COVERAGE (remaining states with 3-5 masts each)
  // ============================================================

  // Osun additional
  { id: "tm_272", name: "Airtel Ejigbo Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Osun", lga: "Ejigbo", address: "Ejigbo Town", lat: 7.9045, lng: 4.3123, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-02" },

  // Lagos additional
  { id: "tm_273", name: "GLO Ibeju-Lekki Tower", provider: "Globacom", providerShort: "GLO", state: "Lagos", lga: "Ibeju-Lekki", address: "Lekki Free Trade Zone Road", lat: 6.4448, lng: 3.7915, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-14" },
  { id: "tm_274", name: "MTN Shomolu Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Shomolu", address: "Bajulaiye Road, Shomolu", lat: 6.5385, lng: 3.3815, tampered: 1, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },

  // Kano additional
  { id: "tm_275", name: "MTN Kano Sabon Gari Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kano", lga: "Fagge", address: "Sabon Gari Market Area", lat: 12.0058, lng: 8.5275, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-12" },

  // FCT additional
  { id: "tm_276", name: "9mobile Mabushi Tower", provider: "9mobile", providerShort: "9MB", state: "FCT", lga: "Abuja Municipal", address: "Mabushi District", lat: 9.0832, lng: 7.4540, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 84, batteryCharge: 95, lastMaintenance: "2026-03-14" },

  // Kaduna additional
  { id: "tm_277", name: "GLO Tudun Wada Kaduna Tower", provider: "Globacom", providerShort: "GLO", state: "Kaduna", lga: "Kaduna North", address: "Tudun Wada, Kaduna", lat: 10.5080, lng: 7.4420, tampered: 3, intruders: 4, status: "critical", towerHeight: 38, generatorFuel: 22, batteryCharge: 48, lastMaintenance: "2025-12-15" },

  // Rivers additional
  { id: "tm_278", name: "Airtel Okrika Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Rivers", lga: "Okrika", address: "Okrika Town", lat: 4.7340, lng: 7.0822, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-08" },

  // Oyo additional
  { id: "tm_279", name: "Airtel Ibadan Agodi Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Oyo", lga: "Ibadan North-East", address: "Agodi GRA, Ibadan", lat: 7.4020, lng: 3.9180, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },

  // Borno additional
  { id: "tm_280", name: "Airtel Hawul Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Borno", lga: "Hawul", address: "Azare Hawul", lat: 10.5040, lng: 12.1160, tampered: 3, intruders: 5, status: "critical", towerHeight: 40, generatorFuel: 16, batteryCharge: 36, lastMaintenance: "2025-10-05" },

  // Enugu additional
  { id: "tm_281", name: "MTN Enugu South Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Enugu", lga: "Enugu South", address: "Uwani, Enugu", lat: 6.4272, lng: 7.4898, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },

  // Imo additional
  { id: "tm_282", name: "9mobile Orlu Tower", provider: "9mobile", providerShort: "9MB", state: "Imo", lga: "Orlu", address: "Orlu-Mgbee Road", lat: 5.7860, lng: 7.0280, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-22" },

  // Plateau additional
  { id: "tm_283", name: "MTN Jos South Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Plateau", lga: "Jos South", address: "Angwan Rogo, Jos South", lat: 9.8322, lng: 8.8690, tampered: 1, intruders: 1, status: "alert", towerHeight: 40, generatorFuel: 58, batteryCharge: 80, lastMaintenance: "2026-02-12" },

  // Abia additional
  { id: "tm_284", name: "Airtel Umuahia South Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Abia", lga: "Umuahia South", address: "Umuahia-Ikot Ekpene Road", lat: 5.5020, lng: 7.4760, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },

  // Anambra additional
  { id: "tm_285", name: "MTN Onitsha Bridgehead Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Anambra", lga: "Onitsha North", address: "Upper Iweka, Onitsha", lat: 6.1580, lng: 6.7740, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 50, batteryCharge: 76, lastMaintenance: "2026-01-25" },

  // Bauchi additional
  { id: "tm_286", name: "GLO Bauchi GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Bauchi", lga: "Bauchi", address: "GRA, Bauchi", lat: 10.3040, lng: 9.8350, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-05" },

  // Cross River additional
  { id: "tm_287", name: "GLO Calabar South Tower", provider: "Globacom", providerShort: "GLO", state: "Cross River", lga: "Calabar South", address: "Calabar Free Trade Zone Area", lat: 4.9350, lng: 8.3410, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-10" },

  // Benue additional
  { id: "tm_288", name: "Airtel Makurdi New Bridge Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Benue", lga: "Makurdi", address: "Old Otukpo Road, Makurdi", lat: 7.7100, lng: 8.5260, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-02" },

  // Delta additional
  { id: "tm_289", name: "9mobile Warri Tower", provider: "9mobile", providerShort: "9MB", state: "Delta", lga: "Warri South", address: "Airport Road, Warri", lat: 5.5280, lng: 5.7380, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-08" },

  // Edo additional
  { id: "tm_290", name: "GLO Benin Ekenwan Tower", provider: "Globacom", providerShort: "GLO", state: "Edo", lga: "Oredo", address: "Ekenwan Road, Benin", lat: 6.3460, lng: 5.5820, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-10" },

  // Ekiti additional
  { id: "tm_291", name: "GLO Ado-Ekiti Basiri Tower", provider: "Globacom", providerShort: "GLO", state: "Ekiti", lga: "Ado Ekiti", address: "Basiri Area, Ado-Ekiti", lat: 7.6150, lng: 5.2100, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },

  // Gombe additional
  { id: "tm_292", name: "MTN Gombe Tudun Wada Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Gombe", lga: "Gombe", address: "Tudun Wada, Gombe", lat: 10.2950, lng: 11.1590, tampered: 1, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 87, lastMaintenance: "2026-02-28" },

  // Kogi additional
  { id: "tm_293", name: "GLO Lokoja Felele Tower", provider: "Globacom", providerShort: "GLO", state: "Kogi", lga: "Lokoja", address: "Felele, Lokoja", lat: 7.8120, lng: 6.7530, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },

  // Kwara additional
  { id: "tm_294", name: "Airtel Ilorin Tanke Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Kwara", lga: "Ilorin South", address: "Tanke, University Road, Ilorin", lat: 8.4500, lng: 4.5880, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-12" },

  // Nasarawa additional
  { id: "tm_295", name: "GLO Keffi Tower", provider: "Globacom", providerShort: "GLO", state: "Nasarawa", lga: "Keffi", address: "Keffi Town Center", lat: 8.8530, lng: 7.8770, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-05" },

  // Niger additional
  { id: "tm_296", name: "Airtel Suleja Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Niger", lga: "Suleja", address: "Suleja-Minna Road", lat: 9.1780, lng: 7.1700, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-08" },

  // Ogun additional
  { id: "tm_297", name: "MTN Owode Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ogun", lga: "Obafemi Owode", address: "Lagos-Ibadan Expressway, Owode", lat: 6.8890, lng: 3.4830, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-14" },

  // Ondo additional
  { id: "tm_298", name: "GLO Ore Tower", provider: "Globacom", providerShort: "GLO", state: "Ondo", lga: "Odigbo", address: "Benin-Ore Expressway, Ore", lat: 6.7470, lng: 4.8694, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-05" },

  // Sokoto additional
  { id: "tm_299", name: "GLO Sokoto GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Sokoto", lga: "Sokoto South", address: "GRA, Sokoto", lat: 13.0480, lng: 5.2290, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-28" },

  // Taraba additional
  { id: "tm_300", name: "Airtel Jalingo South Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Taraba", lga: "Jalingo", address: "Jalingo-Yola Road", lat: 8.8810, lng: 11.3690, tampered: 1, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-20" },

  // Yobe additional
  { id: "tm_301", name: "Airtel Potiskum Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Yobe", lga: "Potiskum", address: "Potiskum-Damaturu Road", lat: 11.7200, lng: 11.0750, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-25" },

  // Zamfara additional
  { id: "tm_302", name: "GLO Gusau GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Zamfara", lga: "Gusau", address: "GRA, Gusau", lat: 12.1760, lng: 6.6680, tampered: 2, intruders: 3, status: "alert", towerHeight: 38, generatorFuel: 50, batteryCharge: 74, lastMaintenance: "2026-02-05" },

  // Akwa Ibom additional
  { id: "tm_303", name: "MTN Uyo Ring Road Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Akwa Ibom", lga: "Uyo", address: "Ring Road, Uyo", lat: 5.0350, lng: 7.9310, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-12" },

  // Adamawa additional
  { id: "tm_304", name: "GLO Yola GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Adamawa", lga: "Yola South", address: "GRA, Yola", lat: 9.2160, lng: 12.4740, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-28" },

  // Bayelsa additional
  { id: "tm_305", name: "Airtel Yenagoa Azikoro Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Bayelsa", lga: "Yenagoa", address: "Azikoro Road, Yenagoa", lat: 4.9180, lng: 6.2480, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-05" },

  // Ebonyi additional
  { id: "tm_306", name: "GLO Abakaliki Central Tower", provider: "Globacom", providerShort: "GLO", state: "Ebonyi", lga: "Abakaliki", address: "Ogoja Road, Abakaliki", lat: 6.3240, lng: 8.0980, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-08" },

  // Jigawa additional
  { id: "tm_307", name: "GLO Dutse GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Jigawa", lga: "Dutse", address: "GRA, Dutse", lat: 11.7620, lng: 9.3440, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-05" },

  // Kebbi additional
  { id: "tm_308", name: "GLO Birnin Kebbi GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Kebbi", lga: "Birnin Kebbi", address: "GRA, Birnin Kebbi", lat: 12.4480, lng: 4.2050, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },

  // ============================================================
  // HIGHWAY CORRIDOR MASTS
  // ============================================================
  // Lagos-Ibadan Expressway
  { id: "tm_309", name: "MTN Sagamu Interchange Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ogun", lga: "Sagamu", address: "Lagos-Ibadan Expressway, Sagamu", lat: 6.8200, lng: 3.6230, tampered: 0, intruders: 0, status: "secure", towerHeight: 50, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-10" },
  { id: "tm_310", name: "GLO Ogere Tower", provider: "Globacom", providerShort: "GLO", state: "Ogun", lga: "Ikenne", address: "Lagos-Ibadan Expressway, Ogere", lat: 6.8980, lng: 3.6010, tampered: 0, intruders: 0, status: "secure", towerHeight: 48, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-05" },

  // Abuja-Kaduna Expressway
  { id: "tm_311", name: "Airtel Zuba Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "FCT", lga: "Gwagwalada", address: "Abuja-Kaduna Road, Zuba", lat: 9.1168, lng: 7.2370, tampered: 0, intruders: 1, status: "secure", towerHeight: 48, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },

  // Benin-Ore Expressway
  { id: "tm_312", name: "MTN Okada Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Edo", lga: "Ovia North-East", address: "Benin-Ore Road, Okada", lat: 6.7130, lng: 5.3740, tampered: 1, intruders: 0, status: "secure", towerHeight: 46, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-22" },

  // Kano-Maiduguri Highway
  { id: "tm_313", name: "GLO Azare Highway Tower", provider: "Globacom", providerShort: "GLO", state: "Bauchi", lga: "Katagum", address: "Kano-Maiduguri Highway, Azare", lat: 11.6790, lng: 10.1940, tampered: 1, intruders: 2, status: "alert", towerHeight: 48, generatorFuel: 50, batteryCharge: 76, lastMaintenance: "2026-02-05" },

  // East-West Road
  { id: "tm_314", name: "9mobile Eket Highway Tower", provider: "9mobile", providerShort: "9MB", state: "Akwa Ibom", lga: "Eket", address: "East-West Road, Eket", lat: 4.6510, lng: 7.9180, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },

  // Enugu-Onitsha Expressway
  { id: "tm_315", name: "Airtel Awka Highway Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Anambra", lga: "Awka South", address: "Enugu-Onitsha Expressway, Awka", lat: 6.2200, lng: 7.0680, tampered: 0, intruders: 0, status: "secure", towerHeight: 46, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },

  // Abuja-Lokoja Highway
  { id: "tm_316", name: "MTN Abaji Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "FCT", lga: "Abaji", address: "Abaji Town Center", lat: 8.4720, lng: 6.9400, tampered: 0, intruders: 1, status: "secure", towerHeight: 48, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-25" },

  // Lagos-Badagry Expressway
  { id: "tm_317", name: "Airtel Mile 2 Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Lagos", lga: "Amuwo-Odofin", address: "Oshodi-Apapa Expressway, Mile 2", lat: 6.4610, lng: 3.3120, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },

  // Ibadan-Ife Road
  { id: "tm_318", name: "MTN Gbongan Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Osun", lga: "Aiyedaade", address: "Ibadan-Ife Road, Gbongan", lat: 7.4730, lng: 4.3560, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-05" },

  // PH-Aba Road
  { id: "tm_319", name: "GLO Aba-PH Highway Tower", provider: "Globacom", providerShort: "GLO", state: "Abia", lga: "Osisioma", address: "Port Harcourt-Aba Road", lat: 5.0890, lng: 7.3140, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-02" },

  // Kaduna-Abuja Rail Corridor
  { id: "tm_320", name: "9mobile Jere Kaduna Tower", provider: "9mobile", providerShort: "9MB", state: "Kaduna", lga: "Kaduna North", address: "Kaduna-Abuja Railway Station Area", lat: 10.5150, lng: 7.4250, tampered: 2, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-20" },

  // ============================================================
  // MORE MASTS TO REACH 380 TARGET
  // ============================================================

  // Lagos additional dense coverage
  { id: "tm_321", name: "MTN Berger Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Lagos", lga: "Ifako-Ijaiye", address: "Lagos-Abeokuta Expressway, Berger", lat: 6.6427, lng: 3.3180, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 86, batteryCharge: 95, lastMaintenance: "2026-03-14" },
  { id: "tm_322", name: "9mobile Ilupeju Tower", provider: "9mobile", providerShort: "9MB", state: "Lagos", lga: "Mushin", address: "Ilupeju Industrial Estate", lat: 6.5540, lng: 3.3590, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },

  // Abuja additional
  { id: "tm_323", name: "MTN Durumi Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "FCT", lga: "Abuja Municipal", address: "Durumi Phase 1", lat: 9.0280, lng: 7.4740, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 84, batteryCharge: 95, lastMaintenance: "2026-03-12" },
  { id: "tm_324", name: "GLO Wuye Tower", provider: "Globacom", providerShort: "GLO", state: "FCT", lga: "Abuja Municipal", address: "Wuye District", lat: 9.0750, lng: 7.4580, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-08" },

  // PH additional
  { id: "tm_325", name: "MTN D-Line PH Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Rivers", lga: "Port Harcourt", address: "D-Line, Port Harcourt", lat: 4.8060, lng: 7.0150, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-10" },

  // Ibadan additional
  { id: "tm_326", name: "MTN Ibadan Apata Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Oyo", lga: "Ibadan South-West", address: "Apata, Ibadan", lat: 7.3830, lng: 3.8420, tampered: 1, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },

  // Benin additional
  { id: "tm_327", name: "Airtel Benin Ugbowo Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Edo", lga: "Egor", address: "Ugbowo, UNIBEN Area", lat: 6.3980, lng: 5.6120, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },

  // Kano additional
  { id: "tm_328", name: "9mobile Kano Sharada Tower", provider: "9mobile", providerShort: "9MB", state: "Kano", lga: "Kumbotso", address: "Sharada Industrial Area, Kano", lat: 11.9510, lng: 8.4810, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-05" },

  // Kaduna additional
  { id: "tm_329", name: "MTN Kaduna Malali Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kaduna", lga: "Kaduna North", address: "Malali, Kaduna", lat: 10.5380, lng: 7.4530, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 42, batteryCharge: 68, lastMaintenance: "2026-01-10" },

  // Jos additional
  { id: "tm_330", name: "GLO Jos Terminus Tower", provider: "Globacom", providerShort: "GLO", state: "Plateau", lga: "Jos North", address: "Terminus Market, Jos", lat: 9.9200, lng: 8.8840, tampered: 1, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-28" },

  // Calabar additional
  { id: "tm_331", name: "9mobile Calabar Ekpo Abasi Tower", provider: "9mobile", providerShort: "9MB", state: "Cross River", lga: "Calabar Municipal", address: "Ekpo Abasi Street, Calabar", lat: 4.9520, lng: 8.3260, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },

  // Warri additional
  { id: "tm_332", name: "MTN Warri NPA Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Delta", lga: "Warri South", address: "NPA Expressway, Warri", lat: 5.5250, lng: 5.7490, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-01" },

  // Maiduguri additional
  { id: "tm_333", name: "MTN Maiduguri Monday Market Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Borno", lga: "Maiduguri", address: "Custom Road, Monday Market", lat: 11.8380, lng: 13.1450, tampered: 4, intruders: 5, status: "critical", towerHeight: 42, generatorFuel: 16, batteryCharge: 38, lastMaintenance: "2025-10-30" },

  // Sokoto additional
  { id: "tm_334", name: "MTN Sokoto Aliyu Jodi Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Sokoto", lga: "Sokoto North", address: "Aliyu Jodi Road, Sokoto", lat: 13.0560, lng: 5.2330, tampered: 1, intruders: 2, status: "alert", towerHeight: 40, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },

  // Ilorin additional
  { id: "tm_335", name: "MTN Ilorin Taiwo Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kwara", lga: "Ilorin West", address: "Taiwo Road, Ilorin", lat: 8.5010, lng: 4.5490, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },

  // Abeokuta additional
  { id: "tm_336", name: "GLO Abeokuta Kuto Tower", provider: "Globacom", providerShort: "GLO", state: "Ogun", lga: "Abeokuta South", address: "Kuto Area, Abeokuta", lat: 7.1500, lng: 3.3440, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },

  // Akure additional
  { id: "tm_337", name: "GLO Akure Oba-Ile Tower", provider: "Globacom", providerShort: "GLO", state: "Ondo", lga: "Akure North", address: "Oba-Ile, Akure North", lat: 7.3120, lng: 5.1780, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },

  // Owerri additional
  { id: "tm_338", name: "MTN Owerri Nekede Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Imo", lga: "Owerri West", address: "Nekede-FUTO Road, Owerri", lat: 5.4480, lng: 7.0210, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-10" },

  // Uyo additional
  { id: "tm_339", name: "Airtel Uyo Nwaniba Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Akwa Ibom", lga: "Uyo", address: "Nwaniba Road, Uyo", lat: 5.0280, lng: 7.9580, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },

  // More highway towers
  { id: "tm_340", name: "MTN Lokoja Highway Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kogi", lga: "Lokoja", address: "Abuja-Lokoja Expressway", lat: 7.7780, lng: 6.7310, tampered: 0, intruders: 0, status: "secure", towerHeight: 48, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-02" },
  { id: "tm_341", name: "Airtel Onitsha Bridge Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Anambra", lga: "Onitsha North", address: "Niger Bridge, Onitsha", lat: 6.1680, lng: 6.7700, tampered: 0, intruders: 1, status: "secure", towerHeight: 50, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },
  { id: "tm_342", name: "GLO Jebba Bridge Tower", provider: "Globacom", providerShort: "GLO", state: "Kwara", lga: "Moro", address: "Jebba Bridge Area", lat: 9.1150, lng: 4.8190, tampered: 0, intruders: 0, status: "secure", towerHeight: 48, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },

  // More urban fill
  { id: "tm_343", name: "Airtel Gwarinpa Life Camp Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "FCT", lga: "Abuja Municipal", address: "Gwarinpa Junction", lat: 9.1020, lng: 7.4080, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 84, batteryCharge: 95, lastMaintenance: "2026-03-14" },
  { id: "tm_344", name: "GLO Kano Airport Road Tower", provider: "Globacom", providerShort: "GLO", state: "Kano", lga: "Ungogo", address: "Airport Road, Kano", lat: 12.0400, lng: 8.5120, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_345", name: "MTN Calabar Diamond Hill Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Cross River", lga: "Calabar Municipal", address: "Diamond Hill, Calabar", lat: 4.9680, lng: 8.3380, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-12" },

  // Additional strategic fill
  { id: "tm_346", name: "9mobile Makurdi Modern Market Tower", provider: "9mobile", providerShort: "9MB", state: "Benue", lga: "Makurdi", address: "Modern Market, Makurdi", lat: 7.7280, lng: 8.5220, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_347", name: "MTN Awka Amawbia Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Anambra", lga: "Awka South", address: "Amawbia, Near Government House", lat: 6.1990, lng: 7.0560, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },
  { id: "tm_348", name: "GLO Aba Ariaria Tower", provider: "Globacom", providerShort: "GLO", state: "Abia", lga: "Aba South", address: "Ariaria Market Area, Aba", lat: 5.0950, lng: 7.3780, tampered: 1, intruders: 1, status: "alert", towerHeight: 38, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-02-10" },
  { id: "tm_349", name: "Airtel Yenagoa Imgbi Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Bayelsa", lga: "Yenagoa", address: "Imgbi Road, Yenagoa", lat: 4.9310, lng: 6.2700, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-02" },
  { id: "tm_350", name: "MTN Lokoja Mount Patti Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Kogi", lga: "Lokoja", address: "Mount Patti Area, Lokoja", lat: 7.8050, lng: 6.7440, tampered: 0, intruders: 0, status: "secure", towerHeight: 55, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },

  // Semi-urban/rural towers
  { id: "tm_351", name: "GLO Agbor Boji-Boji Tower", provider: "Globacom", providerShort: "GLO", state: "Delta", lga: "Ika South", address: "Boji-Boji Agbor", lat: 6.2600, lng: 6.2010, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-25" },
  { id: "tm_352", name: "MTN Nsukka UNN Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Enugu", lga: "Nsukka", address: "UNN Campus, Nsukka", lat: 6.8640, lng: 7.4020, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 82, batteryCharge: 94, lastMaintenance: "2026-03-14" },
  { id: "tm_353", name: "9mobile Minna Tunga Tower", provider: "9mobile", providerShort: "9MB", state: "Niger", lga: "Chanchaga", address: "Tunga, Minna", lat: 9.6190, lng: 6.5390, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-22" },
  { id: "tm_354", name: "GLO Ado-Ekiti Old Garage Tower", provider: "Globacom", providerShort: "GLO", state: "Ekiti", lga: "Ado Ekiti", address: "Old Garage Area, Ado-Ekiti", lat: 7.6300, lng: 5.2250, tampered: 0, intruders: 0, status: "secure", towerHeight: 36, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-02" },
  { id: "tm_355", name: "Airtel Lafia Doma Road Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Nasarawa", lga: "Lafia", address: "Doma Road, Lafia", lat: 8.4820, lng: 8.5080, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_356", name: "MTN Ife OAU Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Osun", lga: "Ife Central", address: "OAU Campus, Ile-Ife", lat: 7.5180, lng: 4.5200, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 84, batteryCharge: 95, lastMaintenance: "2026-03-12" },
  { id: "tm_357", name: "GLO Ilorin Tanke Tower", provider: "Globacom", providerShort: "GLO", state: "Kwara", lga: "Ilorin South", address: "Tanke, UNILORIN Area", lat: 8.4550, lng: 4.5910, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },
  { id: "tm_358", name: "9mobile Zaria Sabon Gari Tower", provider: "9mobile", providerShort: "9MB", state: "Kaduna", lga: "Sabon Gari", address: "Sabon Gari, Zaria", lat: 11.0710, lng: 7.7050, tampered: 1, intruders: 2, status: "alert", towerHeight: 38, generatorFuel: 50, batteryCharge: 74, lastMaintenance: "2026-02-05" },
  { id: "tm_359", name: "Airtel Benin-Sapele Road Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Edo", lga: "Oredo", address: "Sapele Road Junction, Benin", lat: 6.3260, lng: 5.6050, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 78, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_360", name: "MTN Nnewi Industrial Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Anambra", lga: "Nnewi North", address: "Nkwo Nnewi Industrial Area", lat: 6.0210, lng: 6.9200, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-10" },

  // Final fill to reach ~380
  { id: "tm_361", name: "GLO Ogbomoso South Tower", provider: "Globacom", providerShort: "GLO", state: "Oyo", lga: "Ogbomoso South", address: "Ogbomoso-Oyo Road", lat: 8.1170, lng: 4.2370, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-02" },
  { id: "tm_362", name: "9mobile Warri Refinery Tower", provider: "9mobile", providerShort: "9MB", state: "Delta", lga: "Uvwie", address: "Warri Refinery Road, Ekpan", lat: 5.5530, lng: 5.7610, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },
  { id: "tm_363", name: "Airtel Lafia Stadium Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Nasarawa", lga: "Lafia", address: "Stadium Road, Lafia", lat: 8.4960, lng: 8.5190, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_364", name: "MTN Keffi University Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Nasarawa", lga: "Keffi", address: "NSUK Area, Keffi", lat: 8.8560, lng: 7.8810, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-12" },
  { id: "tm_365", name: "GLO Maiduguri University Tower", provider: "Globacom", providerShort: "GLO", state: "Borno", lga: "Maiduguri", address: "UNIMAID Area, Maiduguri", lat: 11.8540, lng: 13.1280, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 42, batteryCharge: 68, lastMaintenance: "2026-01-10" },
  { id: "tm_366", name: "9mobile Birnin Kebbi Tower", provider: "9mobile", providerShort: "9MB", state: "Kebbi", lga: "Birnin Kebbi", address: "Birnin Kebbi Market Area", lat: 12.4560, lng: 4.2020, tampered: 0, intruders: 1, status: "secure", towerHeight: 38, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_367", name: "MTN Hadejia Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Jigawa", lga: "Hadejia", address: "Hadejia Town Center", lat: 12.4520, lng: 10.0470, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_368", name: "GLO Bauchi Railway Tower", provider: "Globacom", providerShort: "GLO", state: "Bauchi", lga: "Bauchi", address: "Railway Station Area, Bauchi", lat: 10.3140, lng: 9.8380, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_369", name: "Airtel Gombe FUT Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Gombe", lga: "Gombe", address: "FUT Gombe Campus Area", lat: 10.2700, lng: 11.1580, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-08" },
  { id: "tm_370", name: "MTN Yola Jimeta Bridge Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Adamawa", lga: "Yola North", address: "Jimeta Bridge Area", lat: 9.2410, lng: 12.4680, tampered: 1, intruders: 1, status: "alert", towerHeight: 42, generatorFuel: 52, batteryCharge: 76, lastMaintenance: "2026-02-05" },
  { id: "tm_371", name: "GLO Umuahia GRA Tower", provider: "Globacom", providerShort: "GLO", state: "Abia", lga: "Umuahia North", address: "GRA, Umuahia", lat: 5.5320, lng: 7.4950, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-08" },
  { id: "tm_372", name: "9mobile Calabar Marian Tower", provider: "9mobile", providerShort: "9MB", state: "Cross River", lga: "Calabar Municipal", address: "Marian, Calabar", lat: 4.9570, lng: 8.3340, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-10" },
  { id: "tm_373", name: "MTN Afikpo FUNAI Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Ebonyi", lga: "Afikpo North", address: "FUNAI Campus Road, Afikpo", lat: 5.9010, lng: 7.9280, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-12" },
  { id: "tm_374", name: "Airtel Ikare Akungba Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Ondo", lga: "Akoko South-West", address: "Akungba-AAUA Campus", lat: 7.4850, lng: 5.7380, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_375", name: "GLO Ilesa Bowen Tower", provider: "Globacom", providerShort: "GLO", state: "Osun", lga: "Ilesa West", address: "Bowen University Area, Iwo", lat: 7.6180, lng: 4.7280, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 70, batteryCharge: 88, lastMaintenance: "2026-02-22" },
  { id: "tm_376", name: "9mobile Dutse Market Tower", provider: "9mobile", providerShort: "9MB", state: "Jigawa", lga: "Dutse", address: "Dutse Central Market", lat: 11.7590, lng: 9.3410, tampered: 0, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 68, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_377", name: "Airtel Daura Tower", provider: "Airtel Nigeria", providerShort: "AIR", state: "Katsina", lga: "Daura", address: "Daura-Katsina Road", lat: 13.0380, lng: 8.3150, tampered: 2, intruders: 3, status: "alert", towerHeight: 40, generatorFuel: 45, batteryCharge: 70, lastMaintenance: "2026-01-15" },
  { id: "tm_378", name: "MTN Kontagora Market Tower", provider: "MTN Nigeria", providerShort: "MTN", state: "Niger", lga: "Kontagora", address: "Kontagora Central Market", lat: 10.4070, lng: 5.4730, tampered: 0, intruders: 1, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_379", name: "GLO Sokoto Usmanu Danfodiyo Tower", provider: "Globacom", providerShort: "GLO", state: "Sokoto", lga: "Wamako", address: "UDUS Campus, Sokoto", lat: 13.0810, lng: 5.2080, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 74, batteryCharge: 90, lastMaintenance: "2026-03-05" },
  { id: "tm_380", name: "9mobile Jalingo Main Market Tower", provider: "9mobile", providerShort: "9MB", state: "Taraba", lga: "Jalingo", address: "Jalingo Main Market", lat: 8.8970, lng: 11.3610, tampered: 1, intruders: 0, status: "secure", towerHeight: 38, generatorFuel: 66, batteryCharge: 84, lastMaintenance: "2026-02-15" },

  // ============================================================
  // IHS TOWERS (51 sites — independent tower company, all 6 zones)
  // Coordinates derived from LGA HQ locations + known co-location
  // footprint. Heights 35-55m to reflect IHS's mix of greenfield
  // macro + rooftop sites.
  // ============================================================
  // South West
  { id: "tm_381", name: "IHS Ikeja Computer Village Hub", provider: "IHS Towers", providerShort: "IHS", state: "Lagos", lga: "Ikeja", address: "Otigba Street, Ikeja", lat: 6.5910, lng: 3.3480, tampered: 0, intruders: 0, status: "secure", towerHeight: 48, generatorFuel: 85, batteryCharge: 94, lastMaintenance: "2026-03-18" },
  { id: "tm_382", name: "IHS Victoria Island Macro", provider: "IHS Towers", providerShort: "IHS", state: "Lagos", lga: "Eti-Osa", address: "Ahmadu Bello Way, Victoria Island", lat: 6.4290, lng: 3.4250, tampered: 0, intruders: 0, status: "secure", towerHeight: 52, generatorFuel: 92, batteryCharge: 98, lastMaintenance: "2026-03-22" },
  { id: "tm_383", name: "IHS Lekki Phase II Tower", provider: "IHS Towers", providerShort: "IHS", state: "Lagos", lga: "Eti-Osa", address: "Freedom Way, Lekki Phase 2", lat: 6.4490, lng: 3.5210, tampered: 0, intruders: 1, status: "secure", towerHeight: 50, generatorFuel: 80, batteryCharge: 93, lastMaintenance: "2026-03-11" },
  { id: "tm_384", name: "IHS Ikorodu Garage", provider: "IHS Towers", providerShort: "IHS", state: "Lagos", lga: "Ikorodu", address: "Ebute-Ikorodu Road", lat: 6.6160, lng: 3.5080, tampered: 1, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 70, batteryCharge: 87, lastMaintenance: "2026-02-26" },
  { id: "tm_385", name: "IHS Ibadan Ring Road Mast", provider: "IHS Towers", providerShort: "IHS", state: "Oyo", lga: "Ibadan South-West", address: "Ring Road, Ibadan", lat: 7.3775, lng: 3.9470, tampered: 0, intruders: 0, status: "secure", towerHeight: 46, generatorFuel: 82, batteryCharge: 92, lastMaintenance: "2026-03-14" },
  { id: "tm_386", name: "IHS Ibadan UCH Tower", provider: "IHS Towers", providerShort: "IHS", state: "Oyo", lga: "Ibadan North", address: "University College Hospital", lat: 7.4000, lng: 3.9050, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 76, batteryCharge: 91, lastMaintenance: "2026-03-07" },
  { id: "tm_387", name: "IHS Abeokuta Asero Tower", provider: "IHS Towers", providerShort: "IHS", state: "Ogun", lga: "Abeokuta South", address: "Asero Estate, Abeokuta", lat: 7.1500, lng: 3.3500, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 78, batteryCharge: 90, lastMaintenance: "2026-03-04" },
  { id: "tm_388", name: "IHS Ijebu-Ode Interchange", provider: "IHS Towers", providerShort: "IHS", state: "Ogun", lga: "Ijebu Ode", address: "Ibadan-Lagos Expressway", lat: 6.8200, lng: 3.9200, tampered: 1, intruders: 1, status: "alert", towerHeight: 40, generatorFuel: 58, batteryCharge: 80, lastMaintenance: "2026-02-08" },
  { id: "tm_389", name: "IHS Akure GRA Tower", provider: "IHS Towers", providerShort: "IHS", state: "Ondo", lga: "Akure South", address: "GRA, Akure", lat: 7.2510, lng: 5.2100, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 75, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_390", name: "IHS Osogbo Capital Tower", provider: "IHS Towers", providerShort: "IHS", state: "Osun", lga: "Osogbo", address: "Government Reservation Area", lat: 7.7700, lng: 4.5530, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 73, batteryCharge: 88, lastMaintenance: "2026-02-24" },
  { id: "tm_391", name: "IHS Ado Ekiti Secretariat", provider: "IHS Towers", providerShort: "IHS", state: "Ekiti", lga: "Ado-Ekiti", address: "State Secretariat, Ado", lat: 7.6200, lng: 5.2210, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 87, lastMaintenance: "2026-02-19" },

  // South South
  { id: "tm_392", name: "IHS Benin Ring Road", provider: "IHS Towers", providerShort: "IHS", state: "Edo", lga: "Oredo", address: "Ring Road, Benin City", lat: 6.3350, lng: 5.6200, tampered: 0, intruders: 0, status: "secure", towerHeight: 46, generatorFuel: 82, batteryCharge: 93, lastMaintenance: "2026-03-09" },
  { id: "tm_393", name: "IHS Warri Industrial Layout", provider: "IHS Towers", providerShort: "IHS", state: "Delta", lga: "Warri South", address: "Effurun-Warri Industrial Road", lat: 5.5175, lng: 5.7520, tampered: 1, intruders: 2, status: "alert", towerHeight: 48, generatorFuel: 55, batteryCharge: 78, lastMaintenance: "2026-01-28" },
  { id: "tm_394", name: "IHS Asaba Nnebisi Tower", provider: "IHS Towers", providerShort: "IHS", state: "Delta", lga: "Oshimili South", address: "Nnebisi Road, Asaba", lat: 6.2060, lng: 6.7300, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 78, batteryCharge: 90, lastMaintenance: "2026-03-02" },
  { id: "tm_395", name: "IHS Port Harcourt GRA", provider: "IHS Towers", providerShort: "IHS", state: "Rivers", lga: "Port Harcourt", address: "Aba Road GRA Phase II", lat: 4.8150, lng: 7.0230, tampered: 0, intruders: 0, status: "secure", towerHeight: 52, generatorFuel: 88, batteryCharge: 95, lastMaintenance: "2026-03-16" },
  { id: "tm_396", name: "IHS PH Old Airport Tower", provider: "IHS Towers", providerShort: "IHS", state: "Rivers", lga: "Obio-Akpor", address: "Old Airport Road, Rumuokoro", lat: 4.8756, lng: 6.9900, tampered: 2, intruders: 1, status: "alert", towerHeight: 48, generatorFuel: 48, batteryCharge: 72, lastMaintenance: "2026-01-20" },
  { id: "tm_397", name: "IHS Calabar Marina Tower", provider: "IHS Towers", providerShort: "IHS", state: "Cross River", lga: "Calabar Municipal", address: "Marina Resort Road", lat: 4.9700, lng: 8.3250, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 80, batteryCharge: 92, lastMaintenance: "2026-03-06" },
  { id: "tm_398", name: "IHS Uyo Ibom Plaza", provider: "IHS Towers", providerShort: "IHS", state: "Akwa Ibom", lga: "Uyo", address: "Ikot Ekpene Road, Uyo", lat: 5.0380, lng: 7.9090, tampered: 0, intruders: 1, status: "secure", towerHeight: 42, generatorFuel: 76, batteryCharge: 89, lastMaintenance: "2026-02-27" },
  { id: "tm_399", name: "IHS Yenagoa Central Mast", provider: "IHS Towers", providerShort: "IHS", state: "Bayelsa", lga: "Yenagoa", address: "Central Business District", lat: 4.9200, lng: 6.2680, tampered: 1, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 68, batteryCharge: 85, lastMaintenance: "2026-02-14" },

  // South East
  { id: "tm_400", name: "IHS Owerri Wetheral Road", provider: "IHS Towers", providerShort: "IHS", state: "Imo", lga: "Owerri Municipal", address: "Wetheral Road, Owerri", lat: 5.4830, lng: 7.0350, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 82, batteryCharge: 92, lastMaintenance: "2026-03-10" },
  { id: "tm_401", name: "IHS Enugu New Haven Tower", provider: "IHS Towers", providerShort: "IHS", state: "Enugu", lga: "Enugu North", address: "New Haven, Enugu", lat: 6.4450, lng: 7.5050, tampered: 0, intruders: 0, status: "secure", towerHeight: 46, generatorFuel: 84, batteryCharge: 93, lastMaintenance: "2026-03-13" },
  { id: "tm_402", name: "IHS Enugu Independence Layout", provider: "IHS Towers", providerShort: "IHS", state: "Enugu", lga: "Enugu East", address: "Independence Layout, Enugu", lat: 6.4530, lng: 7.5300, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 78, batteryCharge: 90, lastMaintenance: "2026-03-03" },
  { id: "tm_403", name: "IHS Awka Capital City Tower", provider: "IHS Towers", providerShort: "IHS", state: "Anambra", lga: "Awka South", address: "Zik Avenue, Awka", lat: 6.2100, lng: 7.0700, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 80, batteryCharge: 91, lastMaintenance: "2026-03-05" },
  { id: "tm_404", name: "IHS Onitsha Main Market Tower", provider: "IHS Towers", providerShort: "IHS", state: "Anambra", lga: "Onitsha South", address: "Main Market, Onitsha", lat: 6.1440, lng: 6.7850, tampered: 3, intruders: 2, status: "critical", towerHeight: 40, generatorFuel: 32, batteryCharge: 54, lastMaintenance: "2025-12-18" },
  { id: "tm_405", name: "IHS Umuahia Capital Tower", provider: "IHS Towers", providerShort: "IHS", state: "Abia", lga: "Umuahia North", address: "Aba Road, Umuahia", lat: 5.5260, lng: 7.4900, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 74, batteryCharge: 88, lastMaintenance: "2026-02-21" },
  { id: "tm_406", name: "IHS Aba Ariaria Market", provider: "IHS Towers", providerShort: "IHS", state: "Abia", lga: "Aba South", address: "Faulks Road, Aba", lat: 5.1060, lng: 7.3680, tampered: 2, intruders: 1, status: "alert", towerHeight: 40, generatorFuel: 52, batteryCharge: 75, lastMaintenance: "2026-01-22" },
  { id: "tm_407", name: "IHS Abakaliki Centenary Mast", provider: "IHS Towers", providerShort: "IHS", state: "Ebonyi", lga: "Abakaliki", address: "Centenary City, Abakaliki", lat: 6.3250, lng: 8.1180, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 76, batteryCharge: 89, lastMaintenance: "2026-02-26" },

  // FCT
  { id: "tm_408", name: "IHS Abuja CBD Tower", provider: "IHS Towers", providerShort: "IHS", state: "FCT", lga: "Abuja Municipal", address: "Central Business District", lat: 9.0579, lng: 7.4951, tampered: 0, intruders: 0, status: "secure", towerHeight: 55, generatorFuel: 95, batteryCharge: 99, lastMaintenance: "2026-03-20" },
  { id: "tm_409", name: "IHS Kubwa Expressway Mast", provider: "IHS Towers", providerShort: "IHS", state: "FCT", lga: "Bwari", address: "Kubwa Expressway, Bwari", lat: 9.1567, lng: 7.3350, tampered: 0, intruders: 0, status: "secure", towerHeight: 48, generatorFuel: 86, batteryCharge: 94, lastMaintenance: "2026-03-12" },
  { id: "tm_410", name: "IHS Gwagwalada Hub", provider: "IHS Towers", providerShort: "IHS", state: "FCT", lga: "Gwagwalada", address: "University Road, Gwagwalada", lat: 8.9430, lng: 7.0820, tampered: 1, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 74, batteryCharge: 88, lastMaintenance: "2026-02-23" },

  // North Central
  { id: "tm_411", name: "IHS Minna Tunga Tower", provider: "IHS Towers", providerShort: "IHS", state: "Niger", lga: "Chanchaga", address: "Tunga Roundabout, Minna", lat: 9.6150, lng: 6.5550, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 78, batteryCharge: 90, lastMaintenance: "2026-03-01" },
  { id: "tm_412", name: "IHS Ilorin GRA Tower", provider: "IHS Towers", providerShort: "IHS", state: "Kwara", lga: "Ilorin West", address: "Ahmadu Bello Way, GRA", lat: 8.4830, lng: 4.5430, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 80, batteryCharge: 92, lastMaintenance: "2026-03-04" },
  { id: "tm_413", name: "IHS Lokoja Confluence Tower", provider: "IHS Towers", providerShort: "IHS", state: "Kogi", lga: "Lokoja", address: "Confluence Stadium Road", lat: 7.8030, lng: 6.7400, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 75, batteryCharge: 89, lastMaintenance: "2026-02-28" },
  { id: "tm_414", name: "IHS Lafia Shendam Road", provider: "IHS Towers", providerShort: "IHS", state: "Nasarawa", lga: "Lafia", address: "Shendam Road, Lafia", lat: 8.4920, lng: 8.5200, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 72, batteryCharge: 87, lastMaintenance: "2026-02-20" },
  { id: "tm_415", name: "IHS Jos Rayfield Tower", provider: "IHS Towers", providerShort: "IHS", state: "Plateau", lga: "Jos South", address: "Rayfield, Jos", lat: 9.8420, lng: 8.8580, tampered: 1, intruders: 0, status: "secure", towerHeight: 46, generatorFuel: 78, batteryCharge: 91, lastMaintenance: "2026-03-02" },
  { id: "tm_416", name: "IHS Makurdi Wadata Tower", provider: "IHS Towers", providerShort: "IHS", state: "Benue", lga: "Makurdi", address: "Wadata Market, Makurdi", lat: 7.7280, lng: 8.5370, tampered: 0, intruders: 1, status: "secure", towerHeight: 42, generatorFuel: 70, batteryCharge: 86, lastMaintenance: "2026-02-17" },

  // North West
  { id: "tm_417", name: "IHS Kaduna Barnawa Tower", provider: "IHS Towers", providerShort: "IHS", state: "Kaduna", lga: "Kaduna South", address: "Barnawa Layout, Kaduna", lat: 10.4850, lng: 7.4150, tampered: 0, intruders: 0, status: "secure", towerHeight: 46, generatorFuel: 82, batteryCharge: 92, lastMaintenance: "2026-03-08" },
  { id: "tm_418", name: "IHS Kaduna Kawo Tower", provider: "IHS Towers", providerShort: "IHS", state: "Kaduna", lga: "Kaduna North", address: "Kawo Bridge, Kaduna", lat: 10.5700, lng: 7.4400, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 76, batteryCharge: 89, lastMaintenance: "2026-03-01" },
  { id: "tm_419", name: "IHS Zaria Samaru ABU Mast", provider: "IHS Towers", providerShort: "IHS", state: "Kaduna", lga: "Sabon-Gari", address: "Samaru Main Market, Zaria", lat: 11.1500, lng: 7.6400, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 74, batteryCharge: 88, lastMaintenance: "2026-02-24" },
  { id: "tm_420", name: "IHS Kano Bompai Industrial", provider: "IHS Towers", providerShort: "IHS", state: "Kano", lga: "Nassarawa", address: "Bompai Industrial Area", lat: 12.0370, lng: 8.5550, tampered: 2, intruders: 1, status: "alert", towerHeight: 48, generatorFuel: 54, batteryCharge: 76, lastMaintenance: "2026-01-25" },
  { id: "tm_421", name: "IHS Kano Sabon Gari Tower", provider: "IHS Towers", providerShort: "IHS", state: "Kano", lga: "Nassarawa", address: "Sabon Gari Market, Kano", lat: 12.0040, lng: 8.5180, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 78, batteryCharge: 90, lastMaintenance: "2026-03-03" },
  { id: "tm_422", name: "IHS Katsina GRA Tower", provider: "IHS Towers", providerShort: "IHS", state: "Katsina", lga: "Katsina", address: "GRA, Katsina", lat: 12.9950, lng: 7.6020, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 72, batteryCharge: 87, lastMaintenance: "2026-02-22" },
  { id: "tm_423", name: "IHS Sokoto Sultan Road", provider: "IHS Towers", providerShort: "IHS", state: "Sokoto", lga: "Sokoto North", address: "Sultan Abubakar Road", lat: 13.0600, lng: 5.2450, tampered: 0, intruders: 0, status: "secure", towerHeight: 44, generatorFuel: 76, batteryCharge: 89, lastMaintenance: "2026-03-02" },
  { id: "tm_424", name: "IHS Birnin Kebbi Central", provider: "IHS Towers", providerShort: "IHS", state: "Kebbi", lga: "Birnin Kebbi", address: "Kalgo Road, Birnin Kebbi", lat: 12.4540, lng: 4.1980, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 68, batteryCharge: 85, lastMaintenance: "2026-02-15" },
  { id: "tm_425", name: "IHS Dutse Central Tower", provider: "IHS Towers", providerShort: "IHS", state: "Jigawa", lga: "Dutse", address: "Dutse Central, Jigawa", lat: 11.7580, lng: 9.3400, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 86, lastMaintenance: "2026-02-19" },
  { id: "tm_426", name: "IHS Gusau Capital Tower", provider: "IHS Towers", providerShort: "IHS", state: "Zamfara", lga: "Gusau", address: "Gusau Central, Zamfara", lat: 12.1630, lng: 6.6620, tampered: 1, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 66, batteryCharge: 83, lastMaintenance: "2026-02-10" },

  // North East
  { id: "tm_427", name: "IHS Yola Jimeta Tower", provider: "IHS Towers", providerShort: "IHS", state: "Adamawa", lga: "Yola North", address: "Jimeta, Yola", lat: 9.2390, lng: 12.4620, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 72, batteryCharge: 87, lastMaintenance: "2026-02-25" },
  { id: "tm_428", name: "IHS Jalingo Hammaruwa Way", provider: "IHS Towers", providerShort: "IHS", state: "Taraba", lga: "Jalingo", address: "Hammaruwa Way, Jalingo", lat: 8.8980, lng: 11.3620, tampered: 0, intruders: 0, status: "secure", towerHeight: 40, generatorFuel: 70, batteryCharge: 86, lastMaintenance: "2026-02-18" },
  { id: "tm_429", name: "IHS Gombe Akko Tower", provider: "IHS Towers", providerShort: "IHS", state: "Gombe", lga: "Akko", address: "Gombe State University Area", lat: 10.2900, lng: 11.1700, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 74, batteryCharge: 88, lastMaintenance: "2026-02-27" },
  { id: "tm_430", name: "IHS Bauchi Gubi Tower", provider: "IHS Towers", providerShort: "IHS", state: "Bauchi", lga: "Bauchi", address: "Gubi Dam Road, Bauchi", lat: 10.3140, lng: 9.8440, tampered: 0, intruders: 0, status: "secure", towerHeight: 42, generatorFuel: 72, batteryCharge: 87, lastMaintenance: "2026-02-21" },
  { id: "tm_431", name: "IHS Maiduguri Monday Market", provider: "IHS Towers", providerShort: "IHS", state: "Borno", lga: "Maiduguri", address: "Monday Market, Maiduguri", lat: 11.8460, lng: 13.1500, tampered: 1, intruders: 0, status: "alert", towerHeight: 40, generatorFuel: 58, batteryCharge: 79, lastMaintenance: "2026-01-30" },
];

// Nigerian states and their LGAs
export const NIGERIAN_STATES: Record<string, string[]> = {
  "Abia": ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"],
  "Adamawa": ["Demsa", "Fufure", "Ganye", "Gayuk", "Gombi", "Grie", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
  "Akwa Ibom": ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
  "Anambra": ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  "Bauchi": ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"],
  "Bayelsa": ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  "Benue": ["Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Oju", "Okpokwu", "Otukpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  "Borno": ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
  "Cross River": ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"],
  "Delta": ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  "Ebonyi": ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
  "Edo": ["Akoko-Edo", "Benin", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba-Okha", "Oredo", "Orhionmwon", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
  "Ekiti": ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  "Enugu": ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"],
  "FCT": ["Abaji", "Abuja Municipal", "Bwari", "Gwagwalada", "Kuje", "Kwali"],
  "Gombe": ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  "Imo": ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Onuimo", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West"],
  "Jigawa": ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kaugama", "Kazaure", "Kiri Kasama", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
  "Kaduna": ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  "Kano": ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nassarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  "Katsina": ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  "Kebbi": ["Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"],
  "Kogi": ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  "Kwara": ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"],
  "Lagos": ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere", "Victoria Island"],
  "Nasarawa": ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  "Niger": ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Munya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  "Ogun": ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Sagamu"],
  "Ondo": ["Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  "Osun": ["Aiyedaade", "Aiyedire", "Atakunmosa East", "Atakunmosa West", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central", "Ife East", "Ife North", "Ife South", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  "Oyo": ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomoso North", "Ogbomoso South", "Ogo Oluwa", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  "Plateau": ["Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  "Rivers": ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emohua", "Etche", "Gokana", "Ikwerre", "Khana", "Obio-Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  "Sokoto": ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  "Taraba": ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  "Yobe": ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
  "Zamfara": ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"],
};

// Approximate center coordinates for each state (for map positioning)
export const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  "Abia": { lat: 5.45, lng: 7.52 },
  "Adamawa": { lat: 9.33, lng: 12.40 },
  "Akwa Ibom": { lat: 5.01, lng: 7.93 },
  "Anambra": { lat: 6.21, lng: 6.94 },
  "Bauchi": { lat: 10.31, lng: 9.84 },
  "Bayelsa": { lat: 4.77, lng: 6.07 },
  "Benue": { lat: 7.34, lng: 8.77 },
  "Borno": { lat: 11.84, lng: 13.15 },
  "Cross River": { lat: 5.96, lng: 8.33 },
  "Delta": { lat: 5.53, lng: 5.76 },
  "Ebonyi": { lat: 6.26, lng: 8.09 },
  "Edo": { lat: 6.63, lng: 5.93 },
  "Ekiti": { lat: 7.72, lng: 5.31 },
  "Enugu": { lat: 6.44, lng: 7.50 },
  "FCT": { lat: 9.06, lng: 7.49 },
  "Gombe": { lat: 10.29, lng: 11.17 },
  "Imo": { lat: 5.57, lng: 7.06 },
  "Jigawa": { lat: 12.23, lng: 9.56 },
  "Kaduna": { lat: 10.52, lng: 7.43 },
  "Kano": { lat: 12.00, lng: 8.52 },
  "Katsina": { lat: 13.01, lng: 7.60 },
  "Kebbi": { lat: 11.49, lng: 4.23 },
  "Kogi": { lat: 7.80, lng: 6.74 },
  "Kwara": { lat: 8.97, lng: 4.39 },
  "Lagos": { lat: 6.52, lng: 3.37 },
  "Nasarawa": { lat: 8.54, lng: 8.11 },
  "Niger": { lat: 9.93, lng: 5.60 },
  "Ogun": { lat: 7.16, lng: 3.35 },
  "Ondo": { lat: 7.09, lng: 4.84 },
  "Osun": { lat: 7.56, lng: 4.52 },
  "Oyo": { lat: 8.12, lng: 3.42 },
  "Plateau": { lat: 9.22, lng: 9.52 },
  "Rivers": { lat: 4.84, lng: 6.92 },
  "Sokoto": { lat: 13.06, lng: 5.24 },
  "Taraba": { lat: 7.87, lng: 10.75 },
  "Yobe": { lat: 12.29, lng: 11.44 },
  "Zamfara": { lat: 12.17, lng: 6.66 },
};

export const ZONE_STATES: Record<string, string[]> = {
  "North-West": ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"],
  "North-East": ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  "North-Central": ["Benue", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau", "FCT"],
  "South-West": ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"],
  "South-East": ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  "South-South": ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"],
};
