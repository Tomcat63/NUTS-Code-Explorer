
import { plzService } from './plzService';
import { NUTS_DATA, NutsNode } from '../data/nuts_code';

export interface SearchResult {
  node: NutsNode | null;
  type: 'plz' | 'text' | 'id' | 'fuzzy';
  error?: string;
}

/**
 * Normalisiert Text für die Suche (Entfernt Umlaute und Sonderzeichen)
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Entfernt Diakritika
};

export const searchService = {
  getAllNodes(node: NutsNode, list: NutsNode[] = []): NutsNode[] {
    list.push(node);
    if (node.children) {
      node.children.forEach(child => this.getAllNodes(child, list));
    }
    return list;
  },

  /**
   * Erweiterte Suche mit Fuzzy-Logik
   */
  findBestMatch(query: string): { node: NutsNode | null; type: 'id' | 'text' | 'fuzzy' } {
    const allNodes = this.getAllNodes(NUTS_DATA);
    const normalizedQuery = normalizeText(query);
    const lowerQuery = query.toLowerCase().trim();

    // 1. Exakter Match ID (Priorität 1)
    const idMatch = allNodes.find(n => n.id.toLowerCase() === lowerQuery);
    if (idMatch) return { node: idMatch, type: 'id' };

    // 2. Exakter Match Name (Priorität 2)
    const exactNameMatch = allNodes.find(n => n.name.toLowerCase() === lowerQuery);
    if (exactNameMatch) return { node: exactNameMatch, type: 'text' };

    // 3. Teil-Match Name (Normalisiert)
    const partialMatches = allNodes
      .filter(n => normalizeText(n.name).includes(normalizedQuery))
      .sort((a, b) => {
        // Kürzere Namen/IDs zuerst (meist wichtigere Regionen)
        if (a.level !== b.level) return a.level - b.level;
        return a.name.length - b.name.length;
      });

    if (partialMatches.length > 0) {
      return { node: partialMatches[0], type: 'fuzzy' };
    }

    return { node: null, type: 'text' };
  },

  async findRegion(query: string): Promise<SearchResult> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return { node: null, type: 'text' };

    // 1. PLZ Suche
    if (/^\d+$/.test(trimmed)) {
      if (trimmed.length === 5) {
        const nutsCode = await plzService.getNuts3Code(trimmed);
        if (nutsCode) {
          const match = this.findBestMatch(nutsCode);
          if (match.node) return { node: match.node, type: 'plz' };
        }
        return { node: null, type: 'plz', error: 'PLZ nicht gefunden' };
      }
      return { node: null, type: 'plz' };
    }

    // 2. Text/Fuzzy Suche
    const result = this.findBestMatch(trimmed);
    return { node: result.node, type: result.type };
  }
};
