
import React, { useMemo } from 'react';
import { NutsNode, Theme } from '../../types/nuts';
import { MindmapNodeComponent } from './MindmapNode';

interface MindmapCanvasProps {
  nodes: any[];
  links: any[];
  scale: number;
  currentTheme: Theme;
  selectedNode: NutsNode | null;
  expandedIds: Set<string>;
  onSelect: (node: NutsNode) => void;
  onToggle: (id: string) => void;
}

export const MindmapCanvas: React.FC<MindmapCanvasProps> = ({
  nodes, links, scale, currentTheme, selectedNode, expandedIds, onSelect, onToggle
}) => {
  const isDark = currentTheme.id !== 'white';

  const canvasSize = useMemo(() => {
    if (nodes.length === 0) return { width: 1000, height: 1000 };
    const maxX = Math.max(...nodes.map(n => n.x)) + 600;
    const maxY = Math.max(...nodes.map(n => n.y)) + 600;
    return { width: maxX * scale, height: maxY * scale };
  }, [nodes, scale]);

  return (
    <main className="flex-1 overflow-auto p-12">
      <svg width={canvasSize.width} height={canvasSize.height} className="select-none overflow-visible">
        <g transform={`translate(50, 50) scale(${scale})`}>
          {links.map((link, i) => (
            <path 
              key={i} 
              d={`M ${link.x1} ${link.y1} C ${link.x1 + 140} ${link.y1}, ${link.x2 - 140} ${link.y2}, ${link.x2} ${link.y2}`} 
              fill="none" 
              stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.05)"} 
              strokeWidth="2" 
            />
          ))}
          {nodes.map((node) => (
            <MindmapNodeComponent 
              key={node.id} 
              node={node} 
              x={node.x} 
              y={node.y} 
              isSelected={selectedNode?.id === node.id} 
              isHighlighted={node.isHighlighted} 
              onSelect={onSelect} 
              onToggle={onToggle} 
              isExpanded={expandedIds.has(node.id)} 
              setHoveredNode={() => {}} 
              theme={currentTheme} 
            />
          ))}
        </g>
      </svg>
    </main>
  );
};
