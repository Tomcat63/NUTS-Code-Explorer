
import { plzService } from './plzService';
import { NUTS_DATA, NutsNode } from '../data/nuts_code';

export interface SearchResult {
  node: NutsNode | null;
  type: 'plz' | 'text' | 'id' | 'fuzzy';
  error?: string;
}

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const searchService = {
  getAllNodes(node: NutsNode, list: NutsNode[] = []): NutsNode[] {
    list.push(node);
    if (node.children) {
      node.children.forEach(child => this.getAllNodes(child, list));
    }
    return list;
  },

  findBestMatch(query: string): { node: NutsNode | null; type: 'id' | 'text' | 'fuzzy' } {
    const allNodes = this.getAllNodes(NUTS_DATA);
    const lowerQuery = query.toLowerCase().trim();
    const normalizedQuery = normalizeText(query);

    // 1. Exakte ID Suche (Case Insensitive)
    const idMatch = allNodes.find(n => n.id.toLowerCase() === lowerQuery);
    if (idMatch) return { node: idMatch, type: 'id' };

    // 2. Exakter Name Suche
    const exactNameMatch = allNodes.find(n => n.name.toLowerCase() === lowerQuery);
    if (exactNameMatch) return { node: exactNameMatch, type: 'text' };

    // 3. Teilübereinstimmung (Normalisiert)
    const partialMatches = allNodes
      .filter(n => normalizeText(n.name).includes(normalizedQuery))
      .sort((a, b) => {
        // Kürzere Namen oder niedrigere Ebenen bevorzugen
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

    // 1. PLZ Logik
    if (/^\d{5}$/.test(trimmed)) {
      try {
        const nutsCode = await plzService.getNuts3Code(trimmed);
        if (nutsCode) {
          // Wir haben einen NUTS-Code aus der Datei, jetzt suchen wir den Knoten dazu
          const match = this.findBestMatch(nutsCode);
          if (match.node) return { node: match.node, type: 'plz' };
        } else {
          // PLZ im Mapping nicht gefunden
          return { node: null, type: 'plz', error: `Die PLZ ${trimmed} ist im NUTS-Mapping 2024 nicht enthalten.` };
        }
      } catch (e) {
        console.warn("PLZ Lookup failed, check file availability");
      }
    }

    // 2. Text/Fuzzy Suche als Fallback
    const result = this.findBestMatch(trimmed);
    if (!result.node) {
      return { node: null, type: 'text', error: `Kein Treffer für '${trimmed}' gefunden.` };
    }
    return { node: result.node, type: result.type };
  }
};
