
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { NUTS_DATA, NutsNode } from './data/nuts_code';
import { getStatsForId } from './data/statistik';
import { searchService } from './services/searchService';
import { runDiagnostics } from './services/testRunner';

const APP_THEMES = [
  { id: 'slate', name: 'Slate Night', bg: 'bg-slate-950', accent: 'blue' },
  { id: 'midnight', name: 'Deep Space', bg: 'bg-[#020617]', accent: 'indigo' },
  { id: 'rose', name: 'Warm Rose', bg: 'bg-[#1a0a0a]', accent: 'rose' },
  { id: 'amber', name: 'Golden Amber', bg: 'bg-[#1a1202]', accent: 'amber' },
  { id: 'sand', name: 'Sandstone', bg: 'bg-[#1c1917]', accent: 'stone' },
  { id: 'white', name: 'Clean White', bg: 'bg-slate-50', accent: 'slate' },
];

const formatPop = (pop: number) => {
  if (pop <= 0) return null;
  if (pop < 1000) return `${pop.toLocaleString()} Tsd.`;
  return `${(pop / 1000).toFixed(2)} Mio.`;
};

const MindmapNode = ({ node, x, y, onSelect, isSelected, isExpanded, onToggle, isHighlighted, visible, setHoveredNode, theme }: any) => {
  if (!visible) return null;
  const isDark = theme.id !== 'white';
  const colorMap = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  const color = colorMap[node.level % 4] || "#94a3b8";

  return (
    <g 
      className="transition-all duration-300 ease-out" 
      transform={`translate(${x}, ${y})`}
      onMouseEnter={(e) => setHoveredNode({ node, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHoveredNode(null)}
      data-node-id={node.id}
    >
      <circle 
        r={isSelected ? 10 : 7} 
        fill={isHighlighted ? (isDark ? '#ffffff' : '#1e293b') : color} 
        className={`${isHighlighted ? 'ring-4 ring-blue-500/40 animate-pulse' : ''} stroke-slate-900 stroke-2 cursor-pointer transition-all hover:brightness-125`}
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      />
      {node.children && (
        <g 
          className="cursor-pointer group" 
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          transform="translate(-18, 0)"
        >
          <circle r={7} fill={isDark ? "#1e293b" : "#f1f5f9"} className="group-hover:fill-blue-500/40 transition-colors" />
          <path 
            d={isExpanded ? "M -3 0 L 3 0" : "M -3 0 L 3 0 M 0 -3 L 0 3"} 
            stroke={isDark ? "white" : "#1e293b"} 
            strokeWidth="1.5" 
          />
        </g>
      )}
      <text
        dy=".31em"
        x={14}
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        className={`text-[12px] select-none cursor-pointer transition-all ${
          isSelected || isHighlighted 
            ? (isDark ? 'fill-white font-bold' : 'fill-slate-900 font-bold') 
            : (isDark ? 'fill-slate-400 hover:fill-slate-100 font-medium' : 'fill-slate-500 hover:fill-slate-900 font-medium')
        }`}
      >
        {node.name} 
        <tspan fillOpacity="0.4" fontSize="10" fontWeight="normal" dx="5">[{node.id}]</tspan>
      </text>
    </g>
  );
};

const App = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["DE", "DE2", "DE25"]));
  const [searchTerm, setSearchTerm] = useState("Fürth");
  const [scale, setScale] = useState(0.85);
  const [showFullHierarchy, setShowFullHierarchy] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(APP_THEMES[0]);
  const [showSettings, setShowSettings] = useState(false);
  
  // App Config
  const [showWikiPanel, setShowWikiPanel] = useState(true);
  
  // Wikipedia State
  const [wikiData, setWikiData] = useState<{title: string, extract: string, thumbnail?: string, url?: string, coords?: {lat: number, lon: number}} | null>(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);

  const totalNutsCount = useMemo(() => {
    let count = 0;
    const traverse = (node: any) => {
      count++;
      if (node.children) node.children.forEach(traverse);
    };
    traverse(NUTS_DATA);
    return count;
  }, []);

  // Wikipedia Integration
  useEffect(() => {
    if (!selectedNode || !showWikiPanel) {
      setWikiData(null);
      return;
    }

    const fetchWiki = async () => {
      setIsWikiLoading(true);
      let cleanName = selectedNode.name
        .replace(/, Stadt/g, '')
        .replace(/, Lk\./g, '')
        .replace(/Regierungsbezirk /g, '')
        .replace(/Landkreis /g, '')
        .replace(/Kreisfreie Stadt /g, '')
        .trim();
      
      if (selectedNode.id === "DE") cleanName = "Deutschland";

      try {
        const resp = await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`);
        if (resp.ok) {
          const data = await resp.json();
          setWikiData({
            title: data.title,
            extract: data.extract,
            thumbnail: data.thumbnail?.source,
            url: data.content_urls?.desktop?.page,
            coords: data.coordinates ? { lat: data.coordinates.lat, lon: data.coordinates.lon } : undefined
          });
        } else {
          setWikiData(null);
        }
      } catch (e) {
        setWikiData(null);
      } finally {
        setIsWikiLoading(false);
      }
    };

    fetchWiki();
  }, [selectedNode, showWikiPanel]);

  const toggleNode = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const newExpanded = new Set<string>();
    const traverse = (node: any) => {
      if (node.children && node.children.length > 0) {
        newExpanded.add(node.id);
        node.children.forEach(traverse);
      }
    };
    traverse(NUTS_DATA);
    setExpandedIds(newExpanded);
  };

  const collapseAll = () => setExpandedIds(new Set(["DE"]));

  const expandToLevel = (level: number) => {
    const newExpanded = new Set<string>(["DE"]);
    const traverse = (node: any) => {
      if (node.level < level) {
        newExpanded.add(node.id);
        if (node.children) node.children.forEach(traverse);
      }
    };
    traverse(NUTS_DATA);
    setExpandedIds(newExpanded);
  };

  const selectAndCenter = (node: any) => {
    if (!node) return;
    setSearchError(null);
    
    const newExpanded = new Set(expandedIds);
    const findAndExpand = (curr: any, targetId: string): boolean => {
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
    setExpandedIds(new Set(newExpanded));
    setSelectedNode(node);

    setTimeout(() => {
      const mapEl = document.querySelector(`[data-node-id="${node.id}"]`);
      if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      const sidebarEl = document.getElementById(`sidebar-item-${node.id}`);
      if (sidebarEl) sidebarEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    const res = await searchService.findRegion(searchTerm);
    if (res.node) {
      selectAndCenter(res.node);
      setSearchError(null);
    } else {
      setSelectedNode(null);
      setSearchError(res.error || `Suche nach '${searchTerm}' erfolglos.`);
    }
  };

  useEffect(() => {
    const initSearch = async () => {
      const res = await searchService.findRegion("Fürth");
      if (res.node) selectAndCenter(res.node);
    };
    initSearch();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setShowSettings(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    runDiagnostics();
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const layoutNodes = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const verticalGap = 45;
    const horizontalGap = 280;
    let currentYIndex = 0;

    const traverseLayout = (node: any, depth: number) => {
      const x = depth * horizontalGap;
      const isExpanded = expandedIds.has(node.id);
      const nodeY = currentYIndex * verticalGap;
      const currentNode = { ...node, x, y: nodeY, isHighlighted: searchTerm.length >= 2 && (node.name.toLowerCase().includes(searchTerm.toLowerCase()) || node.id.toLowerCase().includes(searchTerm.toLowerCase())), visible: true };
      nodes.push(currentNode);
      currentYIndex++;
      if (isExpanded && node.children) {
        node.children.forEach((child: any) => {
          const childResult = traverseLayout(child, depth + 1);
          links.push({ x1: currentNode.x, y1: currentNode.y, x2: childResult.x, y2: childResult.y });
        });
      }
      return currentNode;
    };
    traverseLayout(NUTS_DATA, 0);
    return { nodes, links };
  }, [expandedIds, searchTerm]);

  const canvasSize = useMemo(() => {
    if (layoutNodes.nodes.length === 0) return { width: 1000, height: 1000 };
    const maxX = Math.max(...layoutNodes.nodes.map(n => n.x)) + 600;
    const maxY = Math.max(...layoutNodes.nodes.map(n => n.y)) + 600;
    return { width: maxX * scale, height: maxY * scale };
  }, [layoutNodes, scale]);

  const renderHierarchyList = (node: any) => {
    const isExpanded = expandedIds.has(node.id);
    const isDark = currentTheme.id !== 'white';
    const isSelected = selectedNode?.id === node.id;
    return (
      <div key={node.id} className={`ml-3 border-l ${isDark ? 'border-white/5' : 'border-slate-200'} pl-2`}>
        <div className="flex items-center gap-1 group" id={`sidebar-item-${node.id}`}>
          {node.children && (
            <button onClick={() => toggleNode(node.id)} className={`w-4 h-4 flex items-center justify-center rounded hover:bg-blue-500/20 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isExpanded ? '−' : '+'}
            </button>
          )}
          <button 
            onClick={() => selectAndCenter(node)} 
            className={`text-[10px] py-1 px-1.5 rounded flex-1 text-left transition-all flex items-center gap-1.5 ${
              isSelected 
                ? 'bg-blue-500 text-white font-bold shadow-sm' 
                : (isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <span className="truncate">{node.name}</span>
          </button>
        </div>
        {node.children && isExpanded && node.children.map((c: any) => renderHierarchyList(c))}
      </div>
    );
  };

  const breadcrumbs = useMemo(() => {
    const target = selectedNode || NUTS_DATA;
    const path: any[] = [];
    const findPath = (curr: any, targetId: string): boolean => {
      if (curr.id === targetId) { path.push(curr); return true; }
      if (curr.children) { for (const child of curr.children) { if (findPath(child, targetId)) { path.unshift(curr); return true; } } }
      return false;
    };
    findPath(NUTS_DATA, target.id);
    return path;
  }, [selectedNode]);

  const isDark = currentTheme.id !== 'white';
  const nodeStats = useMemo(() => selectedNode ? getStatsForId(selectedNode.id, selectedNode.pop || 0) : null, [selectedNode]);

  return (
    <div className={`flex h-screen w-full ${currentTheme.bg} transition-colors duration-1000 overflow-hidden font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      {/* LEFT SIDEBAR */}
      <aside className={`w-80 border-r flex flex-col backdrop-blur-2xl z-20 shadow-[20px_0_30px_rgba(0,0,0,0.2)] shrink-0 ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/60 border-slate-200'}`}>
        <div className="p-6 flex flex-col gap-4">
          <header>
            <h1 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>NUTS Explorer ET1</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}>
              {totalNutsCount} Regionen (v2024)
            </div>
          </header>
          <div className="space-y-1">
            <input 
              type="text" placeholder="Suche..." 
              className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50' : 'bg-slate-100 border border-slate-200 focus:ring-2 focus:ring-blue-500/50'}`}
              value={searchTerm} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-1 h-10 pt-2">
              <button onClick={expandAll} className={`flex-1 rounded-lg border text-lg font-bold transition-all hover:bg-blue-600 hover:text-white ${isDark ? 'bg-white/5 border-white/10 text-blue-400' : 'bg-white border-slate-200 text-blue-600'}`}>+</button>
              <button onClick={collapseAll} className={`flex-1 rounded-lg border text-lg font-bold transition-all hover:bg-slate-600 hover:text-white ${isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>-</button>
              {[1, 2, 3].map(lvl => (
                <button key={lvl} onClick={() => expandToLevel(lvl)} className={`flex-[1.5] rounded-lg text-[11px] font-black border transition-all hover:bg-blue-500/20 ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>E{lvl}</button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto sidebar-scrollbar px-6 pb-6 space-y-4">
          {searchError && <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">{searchError}</div>}
          {selectedNode && (
            <div className={`rounded-2xl p-5 border ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
              <div className="text-[33px] font-black text-blue-500 uppercase mb-0.5 leading-none">{selectedNode.id}</div>
              <h2 className={`text-2xl font-bold leading-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedNode.name}</h2>
              <div className="space-y-1.5 border-t border-slate-500/10 pt-2.5 text-[12px]">
                <div className="flex justify-between"><span className="opacity-60">Einwohner:</span><span>{formatPop(nodeStats?.pop || 0) || 'k.A.'}</span></div>
                {nodeStats?.area && <div className="flex justify-between"><span className="opacity-60">Fläche:</span><span>{nodeStats.area.toLocaleString()} km²</span></div>}
              </div>
            </div>
          )}
          <section className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <button onClick={() => setShowFullHierarchy(!showFullHierarchy)} className="w-full flex items-center justify-between p-4 text-[10px] font-bold uppercase opacity-50">
              <span>Struktur</span><span>{showFullHierarchy ? '▼' : '▶'}</span>
            </button>
            {showFullHierarchy && <div className="p-2 pt-0 max-h-[400px] overflow-y-auto sidebar-scrollbar">{renderHierarchyList(NUTS_DATA)}</div>}
          </section>
        </div>

        {/* SETTINGS (15% verkleinert) */}
        <div className="p-4 border-t border-white/5 relative" ref={settingsRef}>
          <button onClick={() => setShowSettings(!showSettings)} className={`w-10 h-10 border rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" fill="none" strokeWidth="2" /></svg>
          </button>
          {showSettings && (
            <div className={`absolute bottom-full left-4 mb-4 w-56 backdrop-blur-2xl border rounded-2xl p-3 shadow-3xl z-50 ${isDark ? 'bg-black/90 border-white/10' : 'bg-white/95 border-slate-200'}`}>
              <div className="mb-3">
                <h3 className="text-[9px] font-black uppercase text-slate-500 px-1 mb-1">Zoom</h3>
                <div className="grid grid-cols-3 gap-1">
                  <button onClick={() => setScale(s => Math.min(s * 1.2, 3))} className="h-7 rounded bg-blue-500/10 text-xs font-bold">+</button>
                  <button onClick={() => setScale(s => Math.max(s * 0.8, 0.2))} className="h-7 rounded bg-blue-500/10 text-xs font-bold">-</button>
                  <button onClick={() => setScale(0.85)} className="h-7 rounded bg-blue-500/10 text-[8px] font-bold">RESET</button>
                </div>
              </div>
              <div className="mb-3">
                <h3 className="text-[9px] font-black uppercase text-slate-500 px-1 mb-1">Ansicht</h3>
                <div className="flex flex-col gap-1.5 px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" className="sr-only" checked={showWikiPanel} onChange={() => setShowWikiPanel(true)} />
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${showWikiPanel ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`} />
                    <span className="text-[10px] font-bold">Wiki-Spalte AN</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" className="sr-only" checked={!showWikiPanel} onChange={() => setShowWikiPanel(false)} />
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${!showWikiPanel ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`} />
                    <span className="text-[10px] font-bold">Wiki-Spalte AUS</span>
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <h3 className="text-[9px] font-black uppercase text-slate-500 px-1 mb-1">Themes</h3>
                <div className="grid grid-cols-4 gap-1.5">{APP_THEMES.map(t => <button key={t.id} onClick={() => setCurrentTheme(t)} title={t.name} className={`h-7 rounded border ${t.bg} ${currentTheme.id === t.id ? 'ring-2 ring-blue-500' : 'border-white/10'}`} />)}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-500/10">
                <h3 className="text-[9px] font-black uppercase text-slate-500 px-1 mb-0.5">About</h3>
                <div className="px-1 text-[10px] leading-tight opacity-60">
                  Team ET1, 01.2026<br />
                  TERCET NUTS v2024
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MINDMAP */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="p-6 pb-2 z-10 shrink-0">
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-xl border shadow-lg ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
            {breadcrumbs.map((node, i) => (
              <React.Fragment key={node.id}>
                <button onClick={() => selectAndCenter(node)} className={`text-[13px] font-bold transition-all hover:text-blue-500 ${i === breadcrumbs.length - 1 ? 'text-blue-500' : (isDark ? 'text-slate-400' : 'text-slate-600')}`}>{node.name}</button>
                {i < breadcrumbs.length - 1 && <span className="text-slate-500 text-[11px] opacity-30">/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
        <main className="flex-1 overflow-auto p-12 mindmap-container">
          <svg width={canvasSize.width} height={canvasSize.height} className="select-none overflow-visible">
            <g transform={`translate(50, 50) scale(${scale})`}>
              {layoutNodes.links.map((link, i) => <path key={i} d={`M ${link.x1} ${link.y1} C ${link.x1 + 140} ${link.y1}, ${link.x2 - 140} ${link.y2}, ${link.x2} ${link.y2}`} fill="none" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.05)"} strokeWidth="2" />)}
              {layoutNodes.nodes.map((node) => <MindmapNode key={node.id} node={node} x={node.x} y={node.y} visible={true} isSelected={selectedNode?.id === node.id} isHighlighted={node.isHighlighted} onSelect={selectAndCenter} onToggle={(id:string)=>toggleNode(id)} isExpanded={expandedIds.has(node.id)} setHoveredNode={setHoveredNode} theme={currentTheme} />)}
            </g>
          </svg>
        </main>
      </div>

      {/* WIKIPEDIA & MAP SIDEBAR */}
      {selectedNode && showWikiPanel && (
        <aside className={`w-[320px] border-l flex flex-col backdrop-blur-2xl z-20 shrink-0 animate-in slide-in-from-right duration-500 ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/60 border-slate-200'}`}>
           <div className="flex-1 overflow-y-auto sidebar-scrollbar">
             {isWikiLoading ? (
               <div className="h-full flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div></div>
             ) : wikiData ? (
               <div className="flex flex-col">
                 {wikiData.thumbnail && <div className="h-44 overflow-hidden relative"><img src={wikiData.thumbnail} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /></div>}
                 <div className="p-6">
                   <h3 className="text-xl font-black mb-3">{wikiData.title}</h3>
                   <p className="text-sm opacity-80 leading-relaxed mb-6">{wikiData.extract}</p>
                   {wikiData.coords && (
                     <div className="mb-6 rounded-xl overflow-hidden border border-blue-500/20">
                       <iframe width="100%" height="150" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${wikiData.coords.lon-0.05}%2C${wikiData.coords.lat-0.05}%2C${wikiData.coords.lon+0.05}%2C${wikiData.coords.lat+0.05}&layer=mapnik&marker=${wikiData.coords.lat}%2C${wikiData.coords.lon}`} style={{ filter: isDark ? 'grayscale(0.8) invert(0.9) contrast(1.2)' : 'none' }}></iframe>
                     </div>
                   )}
                   <a href={wikiData.url} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors">Wiki Artikel</a>
                 </div>
               </div>
             ) : <div className="h-full flex flex-col items-center justify-center opacity-40 p-12 text-center text-xs font-bold"><p>Kein Wikipedia-Eintrag gefunden</p></div>}
           </div>
        </aside>
      )}

      <style>{`
        .mindmap-container::-webkit-scrollbar { width: 10px; height: 10px; }
        .mindmap-container::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.4); border-radius: 10px; }
        .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
