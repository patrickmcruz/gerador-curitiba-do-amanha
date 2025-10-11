import React from 'react';
import { Scenario } from '../constants';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenarios, selectedScenario, onScenarioChange }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
      {scenarios.map((scenario) => (
        <button
          key={scenario.value}
          onClick={() => onScenarioChange(scenario)}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-purple
            ${selectedScenario.value === scenario.value
              ? 'bg-brand-purple text-white shadow-md'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
};
