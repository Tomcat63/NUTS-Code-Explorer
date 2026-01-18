
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { NUTS_DATA } from './data/nuts_code';
import { getStatsForId } from './data/statistik';
import { searchService } from './services/searchService';
import { plzService, PlzStatus } from './services/plzService';
import { runDiagnostics } from './services/testRunner';
import { NutsNode } from './types/nuts';
import { APP_THEMES } from './constants/themes';
import { HierarchyTree } from './components/Sidebar/HierarchyTree';
import { WikiPanel } from './components/Sidebar/WikiPanel';
import { SettingsMenu } from './components/UI/SettingsMenu';
import { MindmapCanvas } from './components/Mindmap/MindmapCanvas';
import { useWikipedia } from './hooks/useWikipedia';
import { useNutsLayout } from './hooks/useNutsLayout';

const formatPop = (pop: number) => pop <= 0 ? null : (pop < 1000 ? `${pop.toLocaleString()} Tsd.` : `${(pop / 1000).toFixed(2)} Mio.`);

const App = () => {
  const [selectedNode, setSelectedNode] = useState<NutsNode | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [plzStatus, setPlzStatus] = useState<PlzStatus>(plzService.getStatus());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["DE", "DE2", "DE25"]));
  const [searchTerm, setSearchTerm] = useState("Fürth");
  const [scale, setScale] = useState(0.85);
  const [showFullHierarchy, setShowFullHierarchy] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(APP_THEMES[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [showWikiPanel, setShowWikiPanel] = useState(true);

  const { wikiData, isLoading: isWikiLoading } = useWikipedia(selectedNode, showWikiPanel);
  const { nodes, links } = useNutsLayout(NUTS_DATA, expandedIds, searchTerm);

  const isDark = currentTheme.id !== 'white';

  const handleSearch = async () => {
    const trimmedQuery = searchTerm.trim();
    if (!trimmedQuery) return;

    setSearchError(null);
    const res = await searchService.findRegion(trimmedQuery);
    setPlzStatus(plzService.getStatus());

    if (res.node) {
      selectAndCenter(res.node);
    } else {
      setSearchError(res.error || `Kein Treffer für '${trimmedQuery}'.`);
    }
  };

  const selectAndCenter = (node: NutsNode) => {
    if (!node) return;
    setSearchError(null);

    const newExpanded = new Set(expandedIds);
    const findAndExpand = (curr: NutsNode, targetId: string): boolean => {
      if (curr.id === targetId) return true;
      if (curr.children) {
        for (const child of curr.children) {
          if (findAndExpand(child, targetId)) {
            newExpanded.add(curr.id);
            return true;
          }
        }
      }
      return false;
    };
    findAndExpand(NUTS_DATA, node.id);

    setExpandedIds(newExpanded);
    setSelectedNode(node);
    setShowFullHierarchy(true);

    setTimeout(() => {
      document.querySelector(`[data-node-id="${node.id}"]`)?.scrollIntoView({
        behavior: 'smooth', block: 'center', inline: 'center'
      });
      const sidebarItem = document.getElementById(`sidebar-item-${node.id}`);
      if (sidebarItem) sidebarItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  };

  useEffect(() => {
    const init = async () => {
      await plzService.init();
      setPlzStatus(plzService.getStatus());
      const res = await searchService.findBestMatch("Fürth");
      if (res.node) selectAndCenter(res.node);
      runDiagnostics();
    };
    init();
  }, []);

  const totalNutsCount = useMemo(() => {
    let count = 0;
    const traverse = (node: NutsNode) => { count++; if (node.children) node.children.forEach(traverse); };
    traverse(NUTS_DATA);
    return count;
  }, []);

  const nodeStats = useMemo(() => selectedNode ? getStatsForId(selectedNode.id, selectedNode.pop || 0) : null, [selectedNode]);

  // Path for breadcrumbs
  const selectedPath = useMemo(() => {
    if (!selectedNode) return [];
    const path: NutsNode[] = [];
    const findPath = (curr: NutsNode, targetId: string): boolean => {
      if (curr.id === targetId) { path.push(curr); return true; }
      if (curr.children) {
        for (const child of curr.children) {
          if (findPath(child, targetId)) { path.unshift(curr); return true; }
        }
      }
      return false;
    };
    findPath(NUTS_DATA, selectedNode.id);
    return path;
  }, [selectedNode]);

  return (
    <div className={`flex h-screen w-full ${currentTheme.bg} transition-colors duration-1000 overflow-hidden font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* Sidebar */}
      <aside className={`w-80 border-r flex flex-col backdrop-blur-2xl z-20 shadow-2xl shrink-0 ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/60 border-slate-200'}`}>
        <div className="p-6 flex flex-col gap-4 shrink-0">
          <header className="flex justify-between items-end">
            <div>
              <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>NUTS Explorer</h1>
              <div className="text-[9px] opacity-40 uppercase tracking-widest font-black">Deutschland 2024</div>
            </div>
            <div className="text-[10px] font-black px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">{totalNutsCount} CODES</div>
          </header>

          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold uppercase opacity-50">Suche nach PLZ/Region</label>
              <div
                title={plzStatus.error || (plzStatus.source === 'file' ? `Datenbank OK (${plzStatus.count} PLZs)` : 'Eingeschränkter Modus')}
                className={`w-2 h-2 rounded-full cursor-help ${plzStatus.source === 'file' ? 'bg-emerald-500' : (plzStatus.source === 'fallback' ? 'bg-amber-500 animate-pulse' : 'bg-red-500')}`}
              />
            </div>
            <input
              type="text"
              placeholder="z.B. München, 10115..."
              className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:bg-white/10' : 'bg-slate-100 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500/50'}`}
              value={searchTerm}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onChange={e => { setSearchTerm(e.target.value); if (searchError) setSearchError(null); }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1 items-center">
              <button onClick={() => {
                const allIds = new Set<string>();
                const traverse = (node: NutsNode) => { if (node.children) { allIds.add(node.id); node.children.forEach(traverse); } };
                traverse(NUTS_DATA);
                setExpandedIds(allIds);
              }} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black border transition-all ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}>
                ALLE AUF
              </button>
              <button onClick={() => setExpandedIds(new Set(["DE"]))} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black border transition-all ${isDark ? 'bg-slate-500/10 border-white/10 text-slate-400 hover:bg-slate-500 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-500 hover:text-white'}`}>
                ALLE ZU
              </button>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map(lvl => (
                <button key={lvl} onClick={() => {
                  const newExpanded = new Set<string>(["DE"]);
                  const traverse = (node: NutsNode) => { if (node.level < lvl && node.children) { newExpanded.add(node.id); node.children.forEach(traverse); } };
                  traverse(NUTS_DATA);
                  setExpandedIds(newExpanded);
                }} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-blue-500 hover:text-white' : 'bg-slate-100 border border-slate-200 hover:bg-blue-500 hover:text-white'}`}>
                  E{lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 flex flex-col min-h-0 custom-scrollbar">
          {searchError && (
            <div className="p-3 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-xl border border-red-500/20 leading-tight shrink-0">
              {searchError}
            </div>
          )}

          {selectedNode && (
            <div className={`rounded-2xl p-5 border shrink-0 ${isDark ? 'bg-white/10 border-white/10 shadow-inner' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
              <div className="text-3xl font-black text-blue-500 mb-1 leading-none tracking-tighter">{selectedNode.id}</div>
              <h2 className="text-lg font-bold mb-3 leading-tight">{selectedNode.name}</h2>
              <div className="text-[11px] space-y-1.5 opacity-70 border-t border-slate-500/10 pt-3">
                <div className="flex justify-between"><span>Ebene:</span><span className="font-bold">NUTS {selectedNode.level}</span></div>
                <div className="flex justify-between"><span>Einwohner:</span><span className="font-bold text-blue-400">{formatPop(nodeStats ? nodeStats.pop : 0) || 'k.A.'}</span></div>
                {nodeStats && typeof nodeStats.area === 'number' && nodeStats.area > 0 && <div className="flex justify-between"><span>Fläche:</span><span className="font-bold">{nodeStats.area.toLocaleString()} km²</span></div>}
              </div>
            </div>
          )}

          <section className={`flex-1 min-h-0 flex flex-col rounded-2xl border overflow-hidden shrink-0 ${isDark ? 'bg-black/20 border-emerald-500/20' : 'bg-emerald-50/10 border-emerald-500/20'}`}>
            <button onClick={() => setShowFullHierarchy(!showFullHierarchy)} className="w-full flex items-center justify-between p-4 text-[10px] font-bold uppercase opacity-50 hover:opacity-100 transition-opacity shrink-0">
              Strukturübersicht
              <span>{showFullHierarchy ? '−' : '+'}</span>
            </button>
            {showFullHierarchy && (
              <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
                <HierarchyTree node={NUTS_DATA} expandedIds={expandedIds} selectedNode={selectedNode} currentTheme={currentTheme} onToggle={id => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} onSelect={selectAndCenter} />
              </div>
            )}
          </section>
        </div>
        <SettingsMenu currentTheme={currentTheme} setTheme={setCurrentTheme} scale={scale} setScale={setScale} resetScale={() => setScale(0.85)} showWiki={showWikiPanel} setShowWiki={setShowWikiPanel} showSettings={showSettings} setShowSettings={setShowSettings} />
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Breadcrumb Navigation */}
        <nav className={`px-6 py-3 border-b flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight z-10 shrink-0 ${isDark ? 'bg-black/20 border-white/10 text-white/40' : 'bg-white/80 border-slate-200 text-slate-500'}`}>
          {selectedPath.length > 0 ? selectedPath.map((node, i) => (
            <React.Fragment key={node.id}>
              {i > 0 && <span className="opacity-20 text-[8px]">▶</span>}
              <button
                onClick={() => selectAndCenter(node)}
                className={`hover:text-blue-500 transition-colors ${i === selectedPath.length - 1 ? (isDark ? 'text-white' : 'text-slate-900') : ''}`}
              >
                {node.name.replace(/, Stadt/g, '').replace(/, Lk\./g, '').replace(/Regierungsbezirk /g, '')}
              </button>
            </React.Fragment>
          )) : <span>Bitte wählen Sie eine Region aus der Liste oder Suche</span>}
        </nav>

        <MindmapCanvas nodes={nodes} links={links} scale={scale} currentTheme={currentTheme} selectedNode={selectedNode} expandedIds={expandedIds} onSelect={selectAndCenter} onToggle={id => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />
      </main>

      {/* Wiki Panel */}
      {selectedNode && showWikiPanel && (
        <aside className={`w-[320px] border-l backdrop-blur-2xl z-20 shrink-0 ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/60 border-slate-200'} overflow-y-auto custom-scrollbar`}>
          <WikiPanel wikiData={wikiData} isLoading={isWikiLoading} theme={currentTheme} />
        </aside>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
