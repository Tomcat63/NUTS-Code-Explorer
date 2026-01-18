
import React from 'react';
import { NutsNode, Theme } from '../../types/nuts';

interface MindmapNodeProps {
  node: NutsNode;
  x: number;
  y: number;
  onSelect: (node: NutsNode) => void;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  isHighlighted: boolean;
  setHoveredNode: (data: any) => void;
  theme: Theme;
}

export const MindmapNodeComponent: React.FC<MindmapNodeProps> = ({
  node, x, y, onSelect, isSelected, isExpanded, onToggle, isHighlighted, setHoveredNode, theme
}) => {
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
