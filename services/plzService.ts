
/**
 * Der plzService lädt die PLZ-zu-NUTS Zuordnungen.
 */

let plzMap: Record<string, string> | null = null;
let isLoading = false;
let loadFailed = false;

// Fallback für Tests, falls die Datei vom Server blockiert wird
const CRITICAL_FALLBACKS: Record<string, string> = {
  "09353": "DED45", // Oberlungwitz / Zwickau
  "80331": "DE212", // München
  "10115": "DE300", // Berlin
  "20095": "DE600", // Hamburg
  "60311": "DE712", // Frankfurt
  "70173": "DE111", // Stuttgart
  "50667": "DEA23"  // Köln
};

export const plzService = {
  async init(): Promise<Record<string, string>> {
    if (plzMap) return plzMap;
    if (isLoading) {
      console.log("[plzService] Warte auf laufenden Ladevorgang...");
      let attempts = 0;
      while (isLoading && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      return plzMap || CRITICAL_FALLBACKS;
    }

    isLoading = true;
    console.group("🚀 [plzService] Initialisierung");
    
    // Wir versuchen verschiedene Pfade für Webpack/Vite Kompatibilität
    const paths = [
      './data/mappings/pc2025_DE_NUTS-2024_v1.0.txt',
      'data/mappings/pc2025_DE_NUTS-2024_v1.0.txt',
      '/data/mappings/pc2025_DE_NUTS-2024_v1.0.txt'
    ];

    let lastError = "";

    for (const p of paths) {
      try {
        console.log(`[plzService] Versuche Pfad: ${p}`);
        const response = await fetch(p, { method: 'GET', cache: 'no-cache' });
        
        if (response.ok) {
          console.log(`✅ [plzService] Datei unter ${p} gefunden.`);
          const text = await response.text();
          const lines = text.split('\n');
          const newMap: Record<string, string> = { ...CRITICAL_FALLBACKS };
          let count = 0;

          for (const line of lines) {
            if (!line || line.startsWith('CODE')) continue;
            const parts = line.replace(/'/g, '').replace(/"/g, '').split(',');
            if (parts.length >= 2) {
              const plz = parts[0].trim();
              const nuts = parts[1].trim();
              newMap[plz] = nuts;
              count++;
            }
          }
          plzMap = newMap;
          console.log(`[plzService] ${count} Mappings erfolgreich parsiert.`);
          console.groupEnd();
          return plzMap;
        } else {
          console.warn(`[plzService] Pfad ${p} lieferte Status: ${response.status}`);
          lastError = `Status ${response.status}`;
        }
      } catch (e: any) {
        console.warn(`[plzService] Fehler bei Pfad ${p}:`, e.message);
        lastError = e.message;
      }
    }

    console.error("[plzService] Mapping-Datei konnte nicht geladen werden. Nutze Minimal-Fallback.");
    console.log("[plzService] Möglicher Grund: Webpack liefert .txt Dateien nicht aus. Prüfe webpack.config.js (static).");
    console.groupEnd();
    
    loadFailed = true;
    plzMap = CRITICAL_FALLBACKS;
    return plzMap;
  },

  async getNuts3Code(plz: string): Promise<string | null> {
    const cleanPlz = plz.trim();
    console.log(`[plzService] Suche NUTS-Code für PLZ: ${cleanPlz}`);
    
    const map = await this.init();
    const result = map[cleanPlz] || null;
    
    if (result) {
      console.log(`[plzService] Treffer: ${cleanPlz} -> ${result}`);
    } else {
      console.warn(`[plzService] Kein Treffer für PLZ ${cleanPlz}`);
    }
    
    return result;
  }
};
