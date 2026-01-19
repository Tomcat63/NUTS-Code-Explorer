
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
import { EurostatPanel } from './components/Sidebar/EurostatPanel';
import { SettingsMenu } from './components/UI/SettingsMenu';
import { AboutDialog } from './components/UI/AboutDialog';
import { MindmapCanvas } from './components/Mindmap/MindmapCanvas';
import { useWikipedia } from './hooks/useWikipedia';
import { useWeather } from './hooks/useWeather';
import { useNutsLayout } from './hooks/useNutsLayout';

const formatPop = (pop: number) => pop <= 0 ? null : (pop < 1000 ? `${pop.toLocaleString()} Tsd.` : `${(pop / 1000).toFixed(2)} Mio.`);

const App = () => {
  const [selectedNode, setSelectedNode] = useState<NutsNode | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [plzStatus, setPlzStatus] = useState<PlzStatus>(plzService.getStatus());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('nuts_expanded_ids');
    return saved ? new Set(JSON.parse(saved)) : new Set(["DE", "DE2", "DE25"]);
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [scale, setScale] = useState(0.85);
  const [showFullHierarchy, setShowFullHierarchy] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('nuts_theme_id');
    return APP_THEMES.find(t => t.id === saved) || APP_THEMES[0];
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showWikiPanel, setShowWikiPanel] = useState(true);
  const [hasSearchResult, setHasSearchResult] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'pdf' | 'audio'>('info');
  const [currentPodcast, setCurrentPodcast] = useState({
    title: "Wie die EU Deutschland statistisch sortiert",
    file: "Wie_die_EU_Deutschland_statistisch_sortiert.m4a"
  });

  const podcasts = [
    { title: "Wie die EU Deutschland statistisch sortiert", file: "Wie_die_EU_Deutschland_statistisch_sortiert.m4a" },
    { title: "Der Code hinter den EU-Milliarden", file: "Der_Code_hinter_den_EU-Milliarden.m4a" }
  ];

  const { wikiData, isLoading: isWikiLoading } = useWikipedia(selectedNode, showWikiPanel);
  const { data: weatherData, loading: weatherLoading } = useWeather(selectedNode?.name || null, showWikiPanel);
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
      setHasSearchResult(true);
    } else {
      setSearchError(res.error || `Kein Treffer für '${trimmedQuery}'.`);
      setHasSearchResult(false);
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
    setHasSearchResult(true);
    setActiveTab('info');

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

      // Load last node from storage
      const lastId = localStorage.getItem('nuts_last_node_id');
      if (lastId) {
        const findNode = (curr: NutsNode): NutsNode | null => {
          if (curr.id === lastId) return curr;
          if (curr.children) {
            for (const c of curr.children) {
              const found = findNode(c);
              if (found) return found;
            }
          }
          return null;
        };
        const node = findNode(NUTS_DATA);
        if (node) selectAndCenter(node);
      } else {
        // Default to Nürnberg if nothing saved
        const res = await searchService.findBestMatch("Nürnberg");
        if (res.node) selectAndCenter(res.node);
      }
    };
    init();
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    localStorage.setItem('nuts_expanded_ids', JSON.stringify(Array.from(expandedIds)));
  }, [expandedIds]);

  useEffect(() => {
    localStorage.setItem('nuts_theme_id', currentTheme.id);
  }, [currentTheme]);

  useEffect(() => {
    if (selectedNode) {
      localStorage.setItem('nuts_last_node_id', selectedNode.id);
    }
  }, [selectedNode]);

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
        <div className="p-6 pb-6 flex flex-col gap-6 shrink-0">
          <header className="flex flex-col ml-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <h1 className="text-[42px] font-black leading-[0.85] tracking-[-0.04em] bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#22D3EE] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(168,85,247,0.2)] py-1">
                  NUTS<br />Explorer
                </h1>
                <div className="text-[11px] opacity-40 uppercase tracking-[0.2em] font-black mt-2.5">Deutschland v2024</div>
              </div>
              <div className="w-28 h-28 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_40px_rgba(59,130,246,0.1)] ring-4 ring-blue-500/5">
                <img src="/assets/logo.jpeg" alt="NUTS Explorer Logo" className="w-full h-full object-cover rounded-[32px] scale-110" />
              </div>
            </div>
          </header>

          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[11px] font-black uppercase opacity-50">Suche nach PLZ/Region</label>
            </div>
            <input
              type="text"
              placeholder="z.B. München, 10115..."
              className={`w-full rounded-xl px-4 py-3 text-base font-medium outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:bg-white/10' : 'bg-slate-100 border border-slate-200 text-slate-900 focus:bg-white focus:border-blue-500/50'}`}
              value={searchTerm}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              onChange={e => { setSearchTerm(e.target.value); if (searchError) setSearchError(null); }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center">
              <button onClick={() => {
                const allIds = new Set<string>();
                const traverse = (node: NutsNode) => { if (node.children) { allIds.add(node.id); node.children.forEach(traverse); } };
                traverse(NUTS_DATA);
                setExpandedIds(allIds);
              }} className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}>
                ALLE AUF
              </button>
              <button onClick={() => setExpandedIds(new Set(["DE"]))} className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${isDark ? 'bg-slate-500/10 border-white/10 text-slate-400 hover:bg-slate-500 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-500 hover:text-white'}`}>
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
                }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-black border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-blue-500 hover:text-white' : 'bg-slate-100 border border-slate-200 hover:bg-blue-500 hover:text-white'}`}>
                  E{lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0 space-y-4 flex flex-col min-h-0 custom-scrollbar">
          {searchError && (
            <div className="p-3 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-xl border border-red-500/20 leading-tight shrink-0">
              {searchError}
            </div>
          )}

          {selectedNode && (
            <div className={`rounded-xl p-3.5 border shrink-0 ${isDark ? 'bg-white/10 border-white/10 shadow-inner' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
              <div className="text-2xl font-black text-blue-500 mb-0.5 leading-none tracking-tighter">{selectedNode.id}</div>
              <h2 className="text-base font-bold mb-2 leading-tight">{selectedNode.name}</h2>
              <div className="text-[11px] space-y-1.5 opacity-70 border-t border-slate-500/10 pt-3">
                <div className="flex justify-between"><span>Ebene:</span><span className="font-bold">NUTS {selectedNode.level}</span></div>
                <div className="flex justify-between"><span>Einwohner:</span><span className="font-bold text-blue-400">{formatPop(nodeStats ? nodeStats.pop : 0) || 'k.A.'}</span></div>
                {nodeStats && typeof nodeStats.area === 'number' && nodeStats.area > 0 && <div className="flex justify-between"><span>Fläche:</span><span className="font-bold">{nodeStats.area.toLocaleString()} km²</span></div>}
              </div>
            </div>
          )}

          {/* Weather Display - repositioned to left menu */}
          {weatherData && (
            <div className={`p-4 rounded-2xl border shrink-0 transition-all animate-in fade-in slide-in-from-bottom-2 ${isDark ? 'bg-white/5 border-white/5' : 'bg-sky-50/20 border-sky-500/10'} flex items-center gap-4`}>
              <span className="text-4xl filter drop-shadow-md">{weatherData.icon}</span>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{weatherData.temp}°C</span>
                  <span className="text-[10px] font-bold uppercase opacity-50 tracking-tight">{weatherData.description}</span>
                </div>
                <div className="text-[10px] opacity-40 font-black uppercase mt-0.5 flex items-center gap-1.5">
                  <span className="text-blue-500">WIND</span>
                  <span className="opacity-20 text-[6px]">●</span>
                  <span>{weatherData.windSpeed} km/h</span>
                </div>
              </div>
            </div>
          )}
          {weatherLoading && (
            <div className={`p-4 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-100'} h-20 shrink-0`} />
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
        <SettingsMenu
          currentTheme={currentTheme}
          setTheme={setCurrentTheme}
          scale={scale}
          setScale={setScale}
          resetScale={() => setScale(0.85)}
          showWiki={showWikiPanel}
          setShowWiki={setShowWikiPanel}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onShowAbout={() => setShowAboutDialog(true)}
        />
      </aside>

      <AboutDialog
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
        totalCodes={totalNutsCount}
        totalPlz={plzStatus.count}
        theme={currentTheme}
      />

      {/* Right Column Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">

        {/* Unified Top Navigation Bar */}
        <header className={`h-14 border-b flex shrink-0 z-30 backdrop-blur-md ${isDark ? 'bg-black/20 border-white/10' : 'bg-white/80 border-slate-200'}`}>
          {/* Breadcrumbs Section */}
          <nav className="flex-1 flex items-center gap-1 px-6 overflow-x-auto custom-scrollbar select-none min-w-0">
            {selectedPath.length > 0 ? selectedPath.map((node, i) => (
              <div key={node.id} className="relative flex items-center group">
                <div
                  className={`relative px-3 py-1 flex items-center gap-1.5 ${i === 0 ? 'rounded-l-md pl-2.5' : 'pl-5'
                    } ${i === selectedPath.length - 1
                      ? 'bg-blue-500 text-white z-10'
                      : `bg-${currentTheme.id === 'white' ? 'slate-200' : 'white/10'} hover:bg-blue-500/50 cursor-pointer ${isDark ? 'text-white' : 'text-slate-700'}`
                    }`}
                  style={{ clipPath: i === selectedPath.length - 1 ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%)' : 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)', marginLeft: i > 0 ? '-10px' : '0' }}
                  onClick={() => selectAndCenter(node)}
                >
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] ${i === selectedPath.length - 1 ? 'bg-white/20' : 'bg-black/5'}`}>
                    {i === 0 ? '🇩🇪' : i}
                  </div>
                  <span className="pr-1 text-[8px] font-bold uppercase tracking-wide">{node.name.replace(/, Stadt/g, '').replace(/, Lk\./g, '').replace(/Regierungsbezirk /g, '')}</span>
                </div>
              </div>
            )) : <span className="text-xs opacity-50">Bitte wählen Sie eine Region aus der Liste oder Suche</span>}
          </nav>

          {/* Tabs Section - Fixed width to match sidebar */}
          {selectedNode && hasSearchResult && showWikiPanel && (
            <div className={`w-[400px] flex shrink-0 border-l ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              {[
                { id: 'info', label: 'Info', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { id: 'pdf', label: 'Dokument', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                { id: 'audio', label: 'Audio', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 10l12-3" /></svg> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5'
                    : `opacity-40 hover:opacity-100 ${isDark ? 'text-white' : 'text-slate-900'}`
                    }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Content Row */}
        <div className="flex-1 flex min-h-0 relative">
          <main className="flex-1 flex flex-col relative overflow-hidden">
            <MindmapCanvas nodes={nodes} links={links} scale={scale} currentTheme={currentTheme} selectedNode={selectedNode} expandedIds={expandedIds} onSelect={selectAndCenter} onToggle={id => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />
          </main>

          {/* Right Sidebar Body */}
          {selectedNode && hasSearchResult && showWikiPanel && (
            <aside className={`w-[400px] border-l backdrop-blur-xl z-20 shrink-0 flex flex-col ${isDark ? 'bg-black/40 border-white/5' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'info' && (
                  <div className="flex flex-col animate-in fade-in duration-300">
                    <WikiPanel wikiData={wikiData} isLoading={isWikiLoading} theme={currentTheme} />
                    <div className="px-6 pb-6 space-y-4">
                      <EurostatPanel node={selectedNode} currentTheme={currentTheme} />
                    </div>
                  </div>
                )}

                {activeTab === 'pdf' && (
                  <div className="h-full flex flex-col animate-in fade-in duration-300">
                    <iframe
                      src="/media/Germany_NUTS_Regional_Typology.pdf"
                      className="w-full h-full border-none shadow-2xl"
                      title="PDF Viewer"
                    />
                  </div>
                )}

                {activeTab === 'audio' && (
                  <div className="p-6 h-full flex flex-col gap-6 animate-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col items-center gap-4 py-4 shrink-0">
                      <div className={`w-32 h-32 rounded-[2rem] ${isDark ? 'bg-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.2)]' : 'bg-blue-50 shadow-lg'} flex items-center justify-center`}>
                        <span className="text-5xl">🎧</span>
                      </div>
                      <div className="text-center space-y-1">
                        <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Audio Research</h3>
                        <p className="text-[10px] text-blue-500 font-bold uppercase">Team ET1 Exclusive</p>
                      </div>
                    </div>

                    {/* Playlist Selection */}
                    <div className="space-y-2 shrink-0">
                      <h4 className="text-[9px] font-black uppercase opacity-40 px-2 tracking-widest">Playlist</h4>
                      <div className="flex flex-col gap-1.5">
                        {podcasts.map((pod, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPodcast(pod)}
                            className={`p-3 rounded-2xl text-left transition-all border flex items-center gap-3 ${currentPodcast.file === pod.file
                              ? 'bg-blue-500/10 border-blue-500/30 shadow-sm'
                              : `bg-transparent border-transparent hover:bg-white/5 opacity-60 hover:opacity-100 ${isDark ? '' : 'hover:bg-slate-50'}`
                              }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${currentPodcast.file === pod.file ? 'bg-blue-500 text-white' : 'bg-slate-500/20 text-xs'}`}>
                              {currentPodcast.file === pod.file ? '▶' : idx + 1}
                            </div>
                            <span className="text-[10px] font-bold leading-tight uppercase tracking-tight">{pod.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Player Card */}
                    <div className={`mt-auto p-5 rounded-[2rem] ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-xl'} space-y-4 shrink-0`}>
                      <div className="space-y-1 px-1">
                        <div className="text-[8px] font-black opacity-30 uppercase tracking-tighter">Now Playing</div>
                        <div className="text-[10px] font-black leading-tight uppercase truncate">{currentPodcast.title}</div>
                      </div>

                      <audio key={currentPodcast.file} controls autoPlay className="w-full h-8 brightness-90 contrast-125">
                        <source src={`/media/${currentPodcast.file}`} type="audio/mp4" />
                        Dein Browser unterstützt diesen Player nicht.
                      </audio>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[8px] font-black opacity-30 uppercase tracking-tighter">Quality: 320kbps</span>
                          <span className="text-[8px] font-black text-blue-500 uppercase">Stereo</span>
                        </div>
                        <div className={`h-1 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'} overflow-hidden`}>
                          <div className="h-full w-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="opacity-25 text-[7px] font-black text-center uppercase tracking-[0.4em] mb-2">
                      Media Source: European Commission Archives
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div >
  );
};

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
