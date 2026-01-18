
export interface NutsNode {
  id: string;
  name: string;
  level: number;
  pop: number;
  children?: NutsNode[];
  isHighlighted?: boolean;
  x?: number;
  y?: number;
}

export interface Theme {
  id: string;
  name: string;
  bg: string;
  accent: string;
}

export interface WikiData {
  title: string;
  extract: string;
  thumbnail?: string;
  url?: string;
  coords?: { lat: number; lon: number };
}
