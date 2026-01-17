
export interface RegionStats {
  pop: number;      // in Tausend
  area: number;     // in km²
  income: number;   // Bruttoeinkommen/Jahr Ø in €
}

// Reale Daten basierend auf Destatis / Regionaldatenbank (Stand 2023/2024)
export const NUTS_STATISTIK: Record<string, RegionStats> = {
  "DE": { pop: 84400, area: 357588, income: 42500 },
  // NUTS 1 - Bundesländer
  "DE1": { pop: 11280, area: 35751, income: 44800 },  // BW
  "DE2": { pop: 13370, area: 70541, income: 45200 },  // BY
  "DE3": { pop: 3780, area: 891, income: 39500 },     // BE
  "DE4": { pop: 2570, area: 29654, income: 36200 },    // BB
  "DE5": { pop: 680, area: 419, income: 40100 },      // HB
  "DE6": { pop: 1890, area: 755, income: 48200 },     // HH
  "DE7": { pop: 6390, area: 21115, income: 43900 },    // HE
  "DE8": { pop: 1620, area: 23211, income: 34500 },    // MV
  "DE9": { pop: 8100, area: 47614, income: 38900 },    // NI
  "DEA": { pop: 18140, area: 34110, income: 41800 },   // NW
  "DEB": { pop: 4120, area: 19854, income: 39200 },    // RP
  "DEC": { pop: 990, area: 2567, income: 38800 },     // SL
  "DED": { pop: 4080, area: 18450, income: 35100 },    // SN
  "DEE": { pop: 2180, area: 20452, income: 34200 },    // ST
  "DEF": { pop: 2950, area: 15800, income: 37500 },    // SH
  "DEG": { pop: 2100, area: 16173, income: 34800 },    // TH

  // NUTS 3 - Auswahl wichtiger Städte
  "DE111": { pop: 632, area: 207, income: 52100 }, // Stuttgart
  "DE212": { pop: 1512, area: 310, income: 58900 }, // München
  "DE501": { pop: 569, area: 325, income: 41200 }, // Bremen Stadt
  "DE712": { pop: 770, area: 248, income: 54300 }, // Frankfurt
  "DEA11": { pop: 620, area: 217, income: 53200 }, // Düsseldorf
  "DEA23": { pop: 1085, area: 405, income: 46800 }, // Köln
  "DED51": { pop: 610, area: 297, income: 36500 }, // Leipzig
  "DEF02": { pop: 248, area: 118, income: 38200 }  // Kiel
};

export const getStatsForId = (id: string, basePop: number): RegionStats => {
  // 1. Wenn exakter Wert vorhanden, nutze ihn
  if (NUTS_STATISTIK[id]) return NUTS_STATISTIK[id];
  
  // 2. Heuristik basierend auf NUTS-Ebene und Region
  const isCity = basePop > 200 && id.length >= 5; // Vermutlich Stadtkreis
  const isEast = ["DE4", "DE8", "DED", "DEE", "DEG"].some(prefix => id.startsWith(prefix));
  
  // Deterministischer Seed für konsistente Werte
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pseudoRandom = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1) + min);
  };

  // Einkommens-Logik: West-Städte > West-Land > Ost-Städte > Ost-Land
  let avgIncome = isEast ? 34000 : 40000;
  if (isCity) avgIncome += 5000;
  
  return {
    pop: basePop,
    area: isCity ? pseudoRandom(100, 400) : pseudoRandom(600, 1500),
    income: avgIncome + pseudoRandom(-2000, 3000)
  };
};
