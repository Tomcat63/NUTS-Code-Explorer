
/**
 * Der plzService lädt die PLZ-zu-NUTS Zuordnungen direkt aus der Textdatei.
 * Dies spart Speicherplatz und macht die Wartung der Daten einfacher.
 */

let plzMap: Record<string, string> | null = null;
let isLoading = false;

export const plzService = {
  /**
   * Lädt und parst die Mapping-Datei.
   */
  async init(): Promise<Record<string, string>> {
    if (plzMap) return plzMap;
    if (isLoading) {
      // Warte kurz, falls bereits geladen wird (simpel)
      while (isLoading) await new Promise(r => setTimeout(r, 50));
      return plzMap || {};
    }

    isLoading = true;
    try {
      const response = await fetch('data/mappings/pc2025_DE_NUTS-2024_v1.0.txt');
      const text = await response.text();
      const lines = text.split('\n');
      const newMap: Record<string, string> = {};

      // Parser für CSV-ähnliches Format: 'PLZ','NUTS'
      for (const line of lines) {
        if (!line || line.startsWith('CODE')) continue;
        
        // Entferne einfache Anführungszeichen und teile am Komma
        const parts = line.replace(/'/g, '').split(',');
        if (parts.length >= 2) {
          const plz = parts[0].trim();
          const nuts = parts[1].trim();
          newMap[plz] = nuts;
        }
      }

      plzMap = newMap;
      console.log(`[plzService] ${Object.keys(plzMap).length} PLZ-Mappings geladen.`);
      return plzMap;
    } catch (error) {
      console.error('[plzService] Fehler beim Laden der Mappings:', error);
      return {};
    } finally {
      isLoading = false;
    }
  },

  /**
   * Findet den NUTS-3 Code für eine gegebene 5-stellige PLZ.
   * Da init() async ist, muss die Suche ggf. warten.
   */
  async getNuts3Code(plz: string): Promise<string | null> {
    const cleanPlz = plz.trim();
    if (!cleanPlz || cleanPlz.length !== 5) return null;
    
    const map = await this.init();
    return map[cleanPlz] || null;
  },

  /**
   * Validiert, ob eine Eingabe syntaktisch eine deutsche PLZ sein könnte.
   */
  isPossiblePlz(input: string): boolean {
    return /^\s*\d{3,5}\s*$/.test(input);
  }
};
