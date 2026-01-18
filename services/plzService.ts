
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
      // Warte kurz, falls bereits geladen wird
      let attempts = 0;
      while (isLoading && attempts < 20) {
        await new Promise(r => setTimeout(r, 50));
        attempts++;
      }
      return plzMap || {};
    }

    isLoading = true;
    try {
      // WICHTIG: In lokaler Entwicklung muss die Datei unter /public oder im Root liegen
      const response = await fetch('data/mappings/pc2025_DE_NUTS-2024_v1.0.txt');
      if (!response.ok) throw new Error('Datei nicht gefunden');
      
      const text = await response.text();
      const lines = text.split('\n');
      const newMap: Record<string, string> = {};

      for (const line of lines) {
        if (!line || line.startsWith('CODE')) continue;
        const parts = line.replace(/'/g, '').split(',');
        if (parts.length >= 2) {
          const plz = parts[0].trim();
          const nuts = parts[1].trim();
          newMap[plz] = nuts;
        }
      }

      plzMap = newMap;
      return plzMap;
    } catch (error) {
      console.warn('[plzService] Mapping konnte nicht geladen werden (lokaler Server-Konfigurationsfehler?). Nutze Textsuche als Fallback.');
      loadFailed = true;
      return {};
    } finally {
      isLoading = false;
    }
  },

  async getNuts3Code(plz: string): Promise<string | null> {
    const cleanPlz = plz.trim();
    if (!cleanPlz || cleanPlz.length !== 5) return null;
    const map = await this.init();
    return map[cleanPlz] || null;
  },

  isPossiblePlz(input: string): boolean {
    return /^\s*\d{3,5}\s*$/.test(input);
  }
};
