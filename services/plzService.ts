
/**
 * Der plzService lädt die PLZ-zu-NUTS Zuordnungen.
 */

export interface PlzStatus {
  loaded: boolean;
  error: string | null;
  count: number;
  source: 'file' | 'fallback' | 'none';
}

let plzMap: Record<string, string> | null = null;
let isLoading = false;
let currentStatus: PlzStatus = { loaded: false, error: null, count: 0, source: 'none' };

// Erweiterte Fallbacks für wichtige Testregionen
const CRITICAL_FALLBACKS: Record<string, string> = {
  "09353": "DED45", // Oberlungwitz / Zwickau
  "90763": "DE253", // Fürth (Südstadt)
  "90762": "DE253", // Fürth (Zentrum)
  "80331": "DE212", // München
  "10115": "DE300", // Berlin
  "20095": "DE600", // Hamburg
  "60311": "DE712", // Frankfurt
  "70173": "DE111", // Stuttgart
  "50667": "DEA23", // Köln
  "01067": "DED21"  // Dresden
};

export const plzService = {
  getStatus(): PlzStatus {
    return currentStatus;
  },

  async init(): Promise<Record<string, string>> {
    if (plzMap && currentStatus.source === 'file') return plzMap;
    if (isLoading) {
      let attempts = 0;
      while (isLoading && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      return plzMap || CRITICAL_FALLBACKS;
    }

    isLoading = true;
    console.group("🔍 [plzService] DIAGNOSE");
    
    const paths = [
      'data/mappings/pc2025_DE_NUTS-2024_v1.0.txt',
      '/data/mappings/pc2025_DE_NUTS-2024_v1.0.txt',
      './data/mappings/pc2025_DE_NUTS-2024_v1.0.txt'
    ];

    for (const p of paths) {
      try {
        console.log(`Versuche: ${window.location.origin}/${p}`);
        const response = await fetch(p, { method: 'GET' });
        
        console.log(`Response Status: ${response.status} (${response.statusText})`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);

        if (response.ok) {
          const text = await response.text();
          if (text.includes('CODE,NUTS3') || text.includes('CODE')) {
            const lines = text.split('\n');
            const newMap: Record<string, string> = { ...CRITICAL_FALLBACKS };
            let count = 0;

            for (const line of lines) {
              if (!line || line.startsWith('CODE')) continue;
              const parts = line.replace(/'/g, '').replace(/"/g, '').split(',');
              if (parts.length >= 2) {
                newMap[parts[0].trim()] = parts[1].trim();
                count++;
              }
            }
            plzMap = newMap;
            currentStatus = { loaded: true, error: null, count: count, source: 'file' };
            console.log(`✅ Erfolg! ${count} Einträge geladen.`);
            console.groupEnd();
            isLoading = false;
            return plzMap;
          } else {
            console.warn("Datei geladen, aber Inhalt scheint kein CSV zu sein. Inhalt beginnt mit:", text.substring(0, 50));
          }
        }
      } catch (e: any) {
        console.warn(`Fehler bei Pfad ${p}:`, e.message);
      }
    }

    console.error("❌ Alle Pfade fehlgeschlagen. Nutze Hard-Fallback.");
    console.groupEnd();
    
    plzMap = CRITICAL_FALLBACKS;
    currentStatus = { 
      loaded: true, 
      error: "Datei konnte nicht vom Server geladen werden (404/Blockiert). Nutze interne Kurz-Liste.", 
      count: Object.keys(CRITICAL_FALLBACKS).length, 
      source: 'fallback' 
    };
    isLoading = false;
    return plzMap;
  },

  async getNuts3Code(plz: string): Promise<string | null> {
    const map = await this.init();
    return map[plz.trim()] || null;
  }
};
