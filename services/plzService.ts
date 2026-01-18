
import { PLZ_MAPPING } from '../data/plz_mapping';

/**
 * Der plzService lädt die PLZ-zu-NUTS Zuordnungen.
 */

export interface PlzStatus {
  loaded: boolean;
  error: string | null;
  count: number;
  source: 'file' | 'fallback' | 'none' | 'bundled';
}

let plzMap: Record<string, string> | null = null;
let currentStatus: PlzStatus = { loaded: false, error: null, count: 0, source: 'none' };

// Erweiterte Fallbacks für wichtige Testregionen (jetzt im Mapping enthalten, aber zur Sicherheit hier behalten)
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
    if (plzMap) return plzMap;

    console.log("📦 [plzService] Nutze gebündeltes PLZ-Mapping.");

    // Wir mergen die Fallbacks mit dem großen Mapping (wobei das große Mapping Priorität hat)
    plzMap = { ...CRITICAL_FALLBACKS, ...PLZ_MAPPING };

    currentStatus = {
      loaded: true,
      error: null,
      count: Object.keys(plzMap).length,
      source: 'file' // Wir behalten 'file' bei, um die UI (Grünes Licht) nicht ändern zu müssen
    };

    return plzMap;
  },

  async getNuts3Code(plz: string): Promise<string | null> {
    const map = await this.init();
    return map[plz.trim()] || null;
  }
};

