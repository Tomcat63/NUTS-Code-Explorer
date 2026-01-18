
/**
 * Der plzService lädt die PLZ-zu-NUTS Zuordnungen direkt aus der Textdatei.
 */

let plzMap: Record<string, string> | null = null;
let isLoading = false;
let loadFailed = false;

export const plzService = {
  /**
   * Lädt und parst die Mapping-Datei.
   */
  async init(): Promise<Record<string, string>> {
    if (plzMap) return plzMap;
    if (loadFailed) return {};
    if (isLoading) {
      let attempts = 0;
      while (isLoading && attempts < 20) {
        await new Promise(r => setTimeout(r, 50));
        attempts++;
      }
      return plzMap || {};
    }

    isLoading = true;
    try {
      // Wir versuchen verschiedene Pfade, da Webpack Dev Server statische Dateien oft unterschiedlich serviert
      const paths = [
        'data/mappings/pc2025_DE_NUTS-2024_v1.0.txt',
        '/data/mappings/pc2025_DE_NUTS-2024_v1.0.txt',
        './data/mappings/pc2025_DE_NUTS-2024_v1.0.txt'
      ];

      let response;
      for (const p of paths) {
        try {
          response = await fetch(p);
          if (response.ok) break;
        } catch (e) { continue; }
      }

      if (!response || !response.ok) {
        throw new Error('Mapping-Datei konnte in keinem Pfad gefunden werden.');
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      const newMap: Record<string, string> = {};

      for (const line of lines) {
        if (!line || line.startsWith('CODE')) continue;
        // Entferne Anführungszeichen und teile am Komma
        const parts = line.replace(/'/g, '').replace(/"/g, '').split(',');
        if (parts.length >= 2) {
          const plz = parts[0].trim();
          const nuts = parts[1].trim();
          newMap[plz] = nuts;
        }
      }

      plzMap = newMap;
      console.log(`[plzService] ${Object.keys(newMap).length} PLZ-Mappings geladen.`);
      return plzMap;
    } catch (error) {
      console.error('[plzService] Kritischer Fehler:', error);
      loadFailed = true;
      return {};
    } finally {
      isLoading = false;
    }
  },

  async getNuts3Code(plz: string): Promise<string | null> {
    const cleanPlz = plz.trim();
    if (!cleanPlz || cleanPlz.length < 5) return null;
    const map = await this.init();
    return map[cleanPlz] || null;
  },

  isPossiblePlz(input: string): boolean {
    return /^\d{5}$/.test(input.trim());
  }
};
