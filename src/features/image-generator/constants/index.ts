export interface Scenario {
  label: string;
  value: string;
  description: string;
}

export const SCENARIOS: Scenario[] = [
  { 
    label: 'Otimista', 
    value: 'Otimista',
    description: ""
  },
  { 
    label: 'Pessimista', 
    value: 'Pessimista',
    description: ""
  },
];

export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'initial' | 'refinement' | 'mask_edit';
  prompt: string;
  thumbnailUrl: string;
  // State to restore
  selectedGeneratedImageIndex: number;
}