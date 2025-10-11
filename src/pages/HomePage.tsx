import React, { useState } from 'react';
import { ImageGenerator } from '../features/image-generator/components/ImageGenerator';
import { Scenario, SCENARIOS } from '../features/image-generator/constants';
import { ScenarioForm } from '../features/image-generator/components/ScenarioForm';

export const HomePage: React.FC = () => {
  const [page, setPage] = useState<'main' | 'form'>('main');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const savedScenarios = localStorage.getItem('futureScenarios');
      return savedScenarios ? JSON.parse(savedScenarios) : SCENARIOS;
    } catch (e) {
      console.error("Failed to parse scenarios from localStorage", e);
      return SCENARIOS;
    }
  });

  const handleSaveScenarios = (updatedScenarios: Scenario[]) => {
    setScenarios(updatedScenarios);
    localStorage.setItem('futureScenarios', JSON.stringify(updatedScenarios));
    setPage('main');
  };

  return (
    <>
      {page === 'main' ? (
        <ImageGenerator
          scenarios={scenarios}
          onManageScenarios={() => setPage('form')}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
        />
      ) : (
        <ScenarioForm
          initialScenarios={scenarios}
          onSave={handleSaveScenarios}
          onCancel={() => setPage('main')}
        />
      )}
    </>
  );
};