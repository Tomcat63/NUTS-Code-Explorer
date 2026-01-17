import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { NUTS_DATA, THEMES } from './data';
import { getStatsForId } from './statistik';

// Hilfsfunktion zur Formatierung der Einwohnerzahl
const formatPop = (pop: number) => {
  if (pop < 1000) return `${pop.toLocaleString()} K`;
  return `${(pop / 1000).toFixed(2)} Mio.`;
};

// Verbessertes getExtraInfo nutzt jetzt die statistik.ts
const getExtraInfo = (node: any) => {
  return getStatsForId(node.id, node.pop);
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
    >
      {node.level > 0 && (
        <line x1={-25} y1={0} x2={0} y2={0} stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="2,2" />
      )}
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
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["DE", "DE1", "DE2", "DE3"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [scale, setScale] = useState(0.85);
  const [showFullHierarchy, setShowFullHierarchy] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [showSettings, setShowSettings] = useState(false);
  
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const collapseAll = () => {
    setExpandedIds(new Set(["DE"]));
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const scaleFactor = 1 - e.deltaY * 0.001;
      setScale(prev => Math.min(Math.max(prev * scaleFactor, 0.15), 3));
    }
  };

  const breadcrumbs = useMemo(() => {
    const target = selectedNode || NUTS_DATA;
    const path: any[] = [];
    const findPath = (curr: any, targetId: string): boolean => {
      if (curr.id === targetId) { path.push(curr); return true; }
      if (curr.children) {
        for (const child of curr.children) {
          if (findPath(child, targetId)) { path.unshift(curr); return true; }
        }
      }
      return false;
    };
    findPath(NUTS_DATA, target.id);
    return path;
  }, [selectedNode]);

  const layoutNodes = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const verticalGap = 45;
    const horizontalGap = 280;
    let currentYIndex = 0;

    const traverseLayout = (node: any, depth: number) => {
      const x = depth * horizontalGap;
      const isExpanded = expandedIds.has(node.id);
      const isHighlighted = searchTerm.length >= 2 && (
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        node.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const nodeY = currentYIndex * verticalGap;
      nodes.push({ ...node, x, y: nodeY, isHighlighted, visible: true });
      currentYIndex++;

      if (isExpanded && node.children) {
        node.children.forEach((child: any) => {
          const childResult = traverseLayout(child, depth + 1);
          links.push({ x1: x, y1: nodeY, x2: childResult.x, y2: childResult.y, parentId: node.id });
        });
      }
      return nodes[nodes.length - 1];
    };

    traverseLayout(NUTS_DATA, 0);
    return { nodes, links };
  }, [expandedIds, searchTerm]);

  const canvasSize = useMemo(() => {
    if (layoutNodes.nodes.length === 0) return { width: 1000, height: 1000 };
    const maxX = Math.max(...layoutNodes.nodes.map(n => n.x)) + 400;
    const maxY = Math.max(...layoutNodes.nodes.map(n => n.y)) + 400;
    return { width: maxX * scale, height: maxY * scale };
  }, [layoutNodes, scale]);

  const selectAndCenter = (node: any) => {
    const newExpanded = new Set(expandedIds);
    const traverseTo = (curr: any, targetId: string, path: string[]) => {
      if (curr.id === targetId) { path.forEach(p => newExpanded.add(p)); return true; }
      if (curr.children) {
        for (const child of curr.children) {
          if (traverseTo(child, targetId, [...path, curr.id])) return true;
        }
      }
      return false;
    };
    traverseTo(NUTS_DATA, node.id, []);
    setExpandedIds(newExpanded);
    setSelectedNode(node);
  };

  const handleSearchEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.length >= 2) {
      const searchLower = searchTerm.toLowerCase();
      let firstMatch: any = null;
      const traverseSearch = (node: any) => {
        if (firstMatch) return;
        if (node.name.toLowerCase().includes(searchLower) || node.id.toLowerCase().includes(searchLower)) {
          firstMatch = node;
        }
        node.children?.forEach(traverseSearch);
      };
      traverseSearch(NUTS_DATA);
      if (firstMatch) selectAndCenter(firstMatch);
    }
  };

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

  const renderHierarchyList = (node: any) => {
    const isExpanded = expandedIds.has(node.id);
    const isDark = currentTheme.id !== 'white';
    return (
      <div key={node.id} className={`ml-3 border-l ${isDark ? 'border-white/5' : 'border-slate-200'} pl-2`}>
        <button
          onClick={() => selectAndCenter(node)}
          className={`text-[10px] py-1 px-1.5 rounded w-full text-left transition-colors flex items-center gap-1.5 ${
            selectedNode?.id === node.id 
              ? 'bg-blue-500/20 text-blue-500 font-bold' 
              : (isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100')
          }`}
        >
          <span className="truncate">{node.name}</span>
          <span className="opacity-30 text-[8px] font-mono ml-auto">[{node.id}]</span>
        </button>
        {node.children && isExpanded && node.children.map((c: any) => renderHierarchyList(c))}
      </div>
    );
  };

  const isDark = currentTheme.id !== 'white';

  return (
    <div className={`flex h-screen w-full ${currentTheme.bg} transition-colors duration-1000 overflow-hidden font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
      
      <aside className={`w-80 border-r flex flex-col backdrop-blur-2xl z-20 shadow-[20px_0_30px_rgba(0,0,0,0.2)] overflow-hidden shrink-0 ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/60 border-slate-200'}`}>
        <div className="p-6 flex flex-col gap-4">
          <header>
            <h1 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>NUTS Explorer</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}>
              {totalNutsCount} NUTS-Codes aktiv
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-2">Version 2024 • Deutschland</p>
          </header>
          
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <label className={`text-[10px] font-black uppercase tracking-widest px-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Suche / Filter</label>
              <input 
                type="text" 
                placeholder="Region suchen (Enter)..." 
                className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 focus:ring-1 focus:ring-blue-500/40' : 'bg-slate-100 border border-slate-200 focus:ring-1 focus:ring-blue-300'}`}
                value={searchTerm}
                onKeyDown={handleSearchEnter}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => expandToLevel(lvl)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'}`}
                  >
                    E{lvl}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={expandAll}
                  title="Alle aufklappen"
                  className={`w-9 py-2 rounded-lg flex items-center justify-center transition-all border ${isDark ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </button>
                <button
                  onClick={collapseAll}
                  title="Alle zuklappen"
                  className={`w-9 py-2 rounded-lg flex items-center justify-center transition-all border ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
          {selectedNode && (
            <div className={`rounded-2xl p-4 border transition-all ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
              <div className="text-[9px] font-bold text-blue-500 uppercase mb-1">{selectedNode.id}</div>
              <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedNode.name}</h2>
              <div className="mt-2 flex flex-col gap-0.5">
                <div className="text-[10px] font-bold opacity-60">{formatPop(getExtraInfo(selectedNode).pop)} Einwohner</div>
                <div className="text-[9px] font-medium text-slate-400">
                  Fläche: {getExtraInfo(selectedNode).area.toLocaleString()} km² • Ø Einkommen: {getExtraInfo(selectedNode).income.toLocaleString()} €
                </div>
              </div>
            </div>
          )}
          <section className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <button onClick={() => setShowFullHierarchy(!showFullHierarchy)} className={`w-full flex items-center justify-between p-4 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
              <span className="text-[10px] font-bold uppercase opacity-50">Hierarchie-Baum</span>
              <svg className={`w-4 h-4 transition-transform ${showFullHierarchy ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2"/></svg>
            </button>
            {showFullHierarchy && <div className="p-2 pt-0 max-h-[500px] overflow-y-auto custom-scrollbar">{renderHierarchyList(NUTS_DATA)}</div>}
          </section>
        </div>

        <div className="p-4 border-t border-white/5 flex justify-start relative" ref={settingsRef}>
           <button onClick={() => setShowSettings(!showSettings)} className={`w-12 h-12 backdrop-blur-xl border rounded-full flex items-center justify-center transition-all ${showSettings ? 'rotate-90 text-blue-500' : 'text-slate-400'} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" fill="none" strokeWidth="2" /></svg>
           </button>
           {showSettings && (
             <div className={`absolute bottom-full left-4 mb-4 w-48 backdrop-blur-2xl border rounded-[1.5rem] p-4 shadow-3xl animate-in fade-in slide-in-from-bottom-2 duration-200 scale-[0.85] origin-bottom-left ${isDark ? 'bg-black/90 border-white/10' : 'bg-white/95 border-slate-200'}`}>
               <div className="mb-4">
                 <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Ansichts-Steuerung</h3>
                 <div className="grid grid-cols-3 gap-2">
                   <button onClick={() => setScale(prev => Math.min(prev * 1.2, 3))} className={`h-8 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>+</button>
                   <button onClick={() => setScale(prev => Math.max(prev * 0.8, 0.15))} className={`h-8 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>-</button>
                   <button onClick={() => setScale(0.85)} className={`h-8 rounded-lg text-[8px] font-black transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>RESET</button>
                 </div>
               </div>
               <div>
                 <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Design</h3>
                 <div className="grid grid-cols-4 gap-2">
                   {THEMES.map(theme => (
                     <button key={theme.id} onClick={() => setCurrentTheme(theme)} className={`h-7 rounded border transition-all ${theme.bg} ${currentTheme.id === theme.id ? 'ring-2 ring-blue-500 scale-110' : 'border-black/10'}`} />
                   ))}
                 </div>
               </div>
             </div>
           )}
        </div>
      </aside>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div className="p-6 pb-2 z-10 shrink-0">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border shadow-sm ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-slate-200'}`}>
            {breadcrumbs.map((node, i) => (
              <React.Fragment key={node.id}>
                <button 
                  onClick={() => selectAndCenter(node)} 
                  className={`text-[12px] font-bold transition-all hover:opacity-80 ${
                    i === breadcrumbs.length - 1 
                      ? 'text-blue-500' 
                      : (isDark ? 'text-slate-400' : 'text-slate-600')
                  }`}
                >
                  {node.name}
                </button>
                {i < breadcrumbs.length - 1 && (
                  <span className={`text-[10px] ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <main 
          className="flex-1 overflow-auto custom-scrollbar relative p-12"
          onWheel={onWheel}
        >
          {hoveredNode && (
            <div className={`fixed z-50 pointer-events-none backdrop-blur-md border p-3 rounded-xl shadow-2xl ${isDark ? 'bg-slate-900/90 border-white/20' : 'bg-white/90 border-slate-200 shadow-xl'}`} style={{ left: hoveredNode.x + 20, top: hoveredNode.y - 40 }}>
              <div className="text-[10px] font-bold text-blue-500 mb-0.5">{hoveredNode.node.id}</div>
              <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{hoveredNode.node.name}</div>
              <div className="text-[9px] font-medium text-slate-400 mt-1">
                {formatPop(getExtraInfo(hoveredNode.node).pop)} • {getExtraInfo(hoveredNode.node).area.toLocaleString()} km² • {getExtraInfo(hoveredNode.node).income.toLocaleString()} €
              </div>
            </div>
          )}
          <svg 
            width={canvasSize.width} 
            height={canvasSize.height} 
            className="select-none overflow-visible"
            style={{ minWidth: '100%', minHeight: '100%' }}
          >
            <g transform={`translate(40, 40) scale(${scale})`}>
              {layoutNodes.links.map((link, i) => (
                <path key={i} d={`M ${link.x1} ${link.y1} C ${link.x1 + 140} ${link.y1}, ${link.x2 - 140} ${link.y2}, ${link.x2} ${link.y2}`} fill="none" stroke={isDark ? "white" : "#cbd5e1"} strokeWidth="1" className="opacity-10" />
              ))}
              {layoutNodes.nodes.map((node) => (
                <MindmapNode key={node.id} node={node} x={node.x} y={node.y} visible={true} isSelected={selectedNode?.id === node.id} isHighlighted={node.isHighlighted} onSelect={selectAndCenter} onToggle={toggleNode} isExpanded={expandedIds.has(node.id)} setHoveredNode={setHoveredNode} theme={currentTheme} />
              ))}
            </g>
          </svg>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .bg-slate-950 .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
