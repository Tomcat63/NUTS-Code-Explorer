
import { useMemo } from 'react';
import { NutsNode } from '../types/nuts';

export const useNutsLayout = (rootData: NutsNode, expandedIds: Set<string>, searchTerm: string) => {
  return useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const verticalGap = 45;
    const horizontalGap = 280;
    let currentYIndex = 0;

    const traverseLayout = (node: NutsNode, depth: number) => {
      const x = depth * horizontalGap;
      const isExpanded = expandedIds.has(node.id);
      const nodeY = currentYIndex * verticalGap;
      
      const isHighlighted = searchTerm.length >= 2 && (
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        node.id.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const currentNode = { ...node, x, y: nodeY, isHighlighted };
      nodes.push(currentNode);
      currentYIndex++;

      if (isExpanded && node.children) {
        node.children.forEach((child: NutsNode) => {
          const childResult = traverseLayout(child, depth + 1);
          links.push({ x1: currentNode.x, y1: currentNode.y, x2: childResult.x, y2: childResult.y });
        });
      }
      return currentNode;
    };

    traverseLayout(rootData, 0);
    return { nodes, links };
  }, [rootData, expandedIds, searchTerm]);
};
