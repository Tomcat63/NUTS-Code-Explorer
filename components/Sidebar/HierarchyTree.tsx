
import React from 'react';
import { NutsNode, Theme } from '../../types/nuts';

interface HierarchyTreeProps {
  node: NutsNode;
  expandedIds: Set<string>;
  selectedNode: NutsNode | null;
  currentTheme: Theme;
  onToggle: (id: string) => void;
  onSelect: (node: NutsNode) => void;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  node, expandedIds, selectedNode, currentTheme, onToggle, onSelect
}) => {
  const isExpanded = expandedIds.has(node.id);
  const isDark = currentTheme.id !== 'white';
  const isSelected = selectedNode?.id === node.id;

  // Bestimmt das Label basierend auf dem NUTS-Level
  const getLevelLabel = (level: number) => {
    if (level === 0) return null;
    return <span className="opacity-40 font-mono text-[9px] mr-1">[E{level}]</span>;
  };

  return (
    <div className={`ml-3 border-l ${isDark ? 'border-emerald-500/30' : 'border-emerald-500/20'} pl-2`}>
      <div className="flex items-center gap-1 group" id={`sidebar-item-${node.id}`}>
        {node.children && (
          <button onClick={() => onToggle(node.id)} className={`w-4 h-4 flex items-center justify-center rounded hover:bg-blue-500/20 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {isExpanded ? '−' : '+'}
          </button>
        )}
        {!node.children && <div className="w-4" />}
        <button
          onClick={() => onSelect(node)}
          className={`text-[10px] py-1 px-1.5 rounded flex-1 text-left transition-all flex items-center gap-0.5 ${isSelected
            ? 'bg-blue-500 text-white font-bold shadow-sm'
            : (isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}
        >
          {getLevelLabel(node.level)}
          <span className="truncate">{node.name}</span>
        </button>
      </div>
      {node.children && isExpanded && node.children.map((c) => (
        <HierarchyTree
          key={c.id}
          node={c}
          expandedIds={expandedIds}
          selectedNode={selectedNode}
          currentTheme={currentTheme}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};