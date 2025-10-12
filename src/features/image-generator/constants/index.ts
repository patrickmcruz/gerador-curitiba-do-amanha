export interface Scenario {
  label: string;
  value: string;
  description: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'initial' | 'refinement' | 'mask_edit';
  prompt: string;
  thumbnailUrl: string;
  // State to restore
  selectedGeneratedImageIndex: number;
}
