
import { plzService } from './plzService';
import { NUTS_DATA, NutsNode } from '../data/nuts_code';

export interface SearchResult {
  node: NutsNode | null;
  type: 'plz' | 'text' | 'id';
  error?: string;
}

/**
 * searchService bietet Methoden zur Auflösung von NUTS-Regionen basierend auf
 * PLZ, Namen oder NUTS-IDs.
 */
export const searchService = {
  /**
   * Sammelt alle Knoten flach in einer Liste für eine gewichtete Suche.
   */
  getAllNodes(node: NutsNode, list: NutsNode[] = []): NutsNode[] {
    list.push(node);
    if (node.children) {
      node.children.forEach(child => this.getAllNodes(child, list));
    }
    return list;
  },

  /**
   * Findet den besten Match im Baum.
   * Strategie: Exakte IDs > Exakte Namen > Teil-Names (Kürzeste ID zuerst = höhere Hierarchie).
   */
  findBestMatch(query: string): NutsNode | null {
    const normalizedQuery = query.toLowerCase().trim();
    const allNodes = this.getAllNodes(NUTS_DATA);

    // 1. Exakter Match ID
    const idMatch = allNodes.find(n => n.id.toLowerCase() === normalizedQuery);
    if (idMatch) return idMatch;

    // 2. Exakter Match Name
    const exactNameMatch = allNodes.find(n => n.name.toLowerCase() === normalizedQuery);
    if (exactNameMatch) return exactNameMatch;

    // 3. Teil-Match Name
    // Wir sortieren nach ID-Länge, damit NUTS-1 (z.B. DE1) vor NUTS-3 (z.B. DE111) gefunden wird
    const partialMatches = allNodes
      .filter(n => n.name.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => a.id.length - b.id.length);

    return partialMatches.length > 0 ? partialMatches[0] : null;
  },

  /**
   * Hauptmethode für die Suche.
   */
  async findRegion(query: string): Promise<SearchResult> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
        return { node: null, type: 'text' };
    }

    // 1. Suche nach PLZ (5 Ziffern)
    const isOnlyDigits = /^\d+$/.test(trimmed);
    if (isOnlyDigits) {
      if (trimmed.length === 5) {
        const nutsCode = await plzService.getNuts3Code(trimmed);
        if (nutsCode) {
          const node = this.findBestMatch(nutsCode);
          if (node) return { node, type: 'plz' };
        }
        return { node: null, type: 'plz', error: 'PLZ nicht im Mapping gefunden' };
      }
      return { node: null, type: 'plz' };
    }

    // 2. Suche nach ID oder Text über gewichteten Matcher
    const node = this.findBestMatch(trimmed);
    if (node) {
      const isId = node.id.toLowerCase() === trimmed.toLowerCase();
      return { node, type: isId ? 'id' : 'text' };
    }

    return { node: null, type: 'text' };
  }
};
