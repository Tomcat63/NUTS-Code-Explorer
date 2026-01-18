
import { searchService } from './searchService';
import { NUTS_DATA } from '../data/nuts_code';

/**
 * Der testRunner führt diagnostische Tests für den searchService durch.
 */
export const runDiagnostics = async () => {
  console.group('🔍 NUTS Explorer Diagnostics (Integrität & Suche)');
  
  // --- TEST 1: Daten-Integritätscheck ---
  console.group('📊 Integritätscheck: NUTS_DATA vs. Mapping-File');
  try {
    const response = await fetch('data/mappings/pc2025_DE_NUTS-2024_v1.0.txt');
    const text = await response.text();
    const lines = text.split('\n');
    
    const txtCodes = new Set<string>();
    lines.forEach(line => {
      if (!line || line.startsWith('CODE')) return;
      const parts = line.replace(/'/g, '').split(',');
      if (parts[1]) txtCodes.add(parts[1].trim());
    });

    const treeCodes = new Set<string>();
    const traverse = (node: any) => {
      treeCodes.add(node.id);
      node.children?.forEach(traverse);
    };
    traverse(NUTS_DATA);

    const missingInTree = Array.from(txtCodes).filter(c => !treeCodes.has(c));
    const missingInTxt = Array.from(treeCodes).filter(c => c.length === 5 && !txtCodes.has(c));

    if (missingInTree.length === 0 && missingInTxt.length === 0) {
      console.log('✅ Datenkonsistenz: Alle NUTS3-Codes im Baum entsprechen der Mapping-Datei.');
    } else {
      if (missingInTree.length > 0) console.warn(`⚠️ Im Baum fehlen ${missingInTree.length} Codes aus der Textdatei:`, missingInTree);
      if (missingInTxt.length > 0) console.warn(`⚠️ In der Textdatei fehlen ${missingInTxt.length} Codes aus dem Baum:`, missingInTxt);
    }
  } catch (e) {
    console.error('❌ Fehler beim Integritäts-Check:', e);
  }
  console.groupEnd();


  // --- TEST 2: Funktionale Suchtests ---
  const tests = [
    { q: "80331", expected: "DE212", desc: "PLZ Suche München" },
    { q: "10115", expected: "DE300", desc: "PLZ Suche Berlin" },
    { q: "Stuttgart", expected: "DE11", desc: "Textsuche (Regierungsbezirk DE11)" },
    { q: "1234", expected: null, desc: "Ungültige PLZ Länge (4 Stellen)" },
    { q: "99999", error: true, desc: "Nicht existierende PLZ" },
    { q: "  80331  ", expected: "DE212", desc: "Führende/nachfolgende Leerzeichen" },
    { q: "berlin", expected: "DE3", desc: "Case-Insensitivity (Berlin DE3)" },
    { q: "DE212", expected: "DE212", desc: "Direkte NUTS-ID Suche" },
    { q: "01067", expected: "DED21", desc: "PLZ mit führender Null (Dresden)" },
    { q: "Baden", expected: "DE1", desc: "NUTS-1 Suche (Baden-Württemberg)" }
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      const res = await searchService.findRegion(t.q);
      let success = false;
      
      if (t.error) {
        success = res.error !== undefined || res.node === null;
      } else if (t.expected === null) {
        success = res.node === null;
      } else {
        success = res.node?.id === t.expected;
      }
      
      if (success) {
        console.log(`✅ PASSED: ${t.desc} [${t.q}]`);
        passed++;
      } else {
        // Hier JSON.stringify oder explizite ID-Anzeige, um [object Object] zu vermeiden
        console.error(`❌ FAILED: ${t.desc}`, { 
          query: t.q, 
          expected: t.expected, 
          receivedId: res.node?.id || 'null',
          error: res.error || 'none'
        });
      }
    } catch (e) {
      console.error(`💥 CRASH: ${t.desc}`, e);
    }
  }

  const allPassed = passed === tests.length;
  console.log(`📊 Resultat: ${passed}/${tests.length} Suchtests erfolgreich.`);
  
  if (allPassed) {
    console.log('%c🚀 Alle Systemtests GRÜN', 'color: green; font-weight: bold;');
  } else {
    console.log('%c⚠️ System-Integrität fehlerhaft', 'color: red; font-weight: bold;');
  }
  
  console.groupEnd();
  return allPassed;
};
