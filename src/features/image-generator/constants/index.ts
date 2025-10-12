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

export const PROMPT_SUGGESTIONS: Record<string, string[]> = {
    Otimista: [
      "arquitetura sustentável",
      "veículos elétricos voadores",
      "muitas áreas verdes",
      "energia solar integrada",
      "prédios com jardins verticais",
      "transporte público futurista",
      "pessoas andando de bicicleta",
      "rios limpos e visíveis",
      "iluminação holográfica",
      "design biofílico",
    ],
    Pessimista: [
      "atmosfera poluída e densa",
      "prédios em ruínas ou abandonados",
      "pouca vegetação",
      "tráfego intenso de veículos antigos",
      "outdoors de neon excessivos",
      "superpopulação visível",
      "estruturas de vigilância",
      "chuva ácida",
      "tecnologia obsoleta e quebrada",
      "desigualdade social evidente",
    ]
};