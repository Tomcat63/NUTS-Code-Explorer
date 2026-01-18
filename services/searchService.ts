
import { plzService } from './plzService';
import { NUTS_DATA, NutsNode } from '../data/nuts_code';

export interface SearchResult {
  node: NutsNode | null;
  type: 'plz' | 'text' | 'id' | 'fuzzy';
  error?: string;
  debugInfo?: string;
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

    console.log(`[searchService] Suche '${lowerQuery}' in ${allNodes.length} Knoten...`);

    const idMatch = allNodes.find(n => n.id.toLowerCase() === lowerQuery);
    if (idMatch) return { node: idMatch, type: 'id' };

    const exactNameMatch = allNodes.find(n => n.name.toLowerCase() === lowerQuery);
    if (exactNameMatch) return { node: exactNameMatch, type: 'text' };

    const partialMatches = allNodes
      .filter(n => normalizeText(n.name).includes(normalizedQuery))
      .sort((a, b) => {
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
    console.log(`--- [searchService] Neue Suche: "${trimmed}" ---`);

    if (trimmed.length < 2) return { node: null, type: 'text' };

    // 1. PLZ Logik
    if (/^\d{5}$/.test(trimmed)) {
      console.log("[searchService] PLZ-Format erkannt.");
      try {
        const nutsCode = await plzService.getNuts3Code(trimmed);
        if (nutsCode) {
          console.log(`[searchService] PLZ ${trimmed} zu NUTS ${nutsCode} aufgelöst.`);
          const match = this.findBestMatch(nutsCode);
          if (match.node) {
            console.log(`[searchService] Knoten ${match.node.id} (${match.node.name}) gefunden.`);
            return { node: match.node, type: 'plz' };
          } else {
            console.error(`[searchService] Code ${nutsCode} existiert nicht im NUTS_DATA Baum!`);
            return { node: null, type: 'plz', error: `Code ${nutsCode} wurde im Datenbaum nicht gefunden.` };
          }
        } else {
          console.warn("[searchService] PLZ im Mapping nicht vorhanden.");
        }
      } catch (e) {
        console.error("[searchService] Fehler bei PLZ-Suche:", e);
      }
    }

    // 2. Text/Fuzzy Suche
    const result = this.findBestMatch(trimmed);
    if (!result.node) {
      console.warn(`[searchService] Kein Text-Treffer für "${trimmed}"`);
      return { node: null, type: 'text', error: `Kein Treffer für '${trimmed}' gefunden.` };
    }
    
    console.log(`[searchService] Text-Treffer: ${result.node.name} (${result.type})`);
    return { node: result.node, type: result.type };
  }
};
