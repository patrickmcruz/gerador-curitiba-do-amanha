import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scenario } from '../constants';
import { PencilIcon } from '../../../components/ui/Icons';

interface ScenarioFormProps {
  onSave: (scenarios: Scenario[]) => void;
  onCancel: () => void;
  prefillDescriptions: boolean;
}

export const ScenarioForm: React.FC<ScenarioFormProps> = ({ onSave, onCancel, prefillDescriptions }) => {
  const { t } = useTranslation();

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const savedScenarios = localStorage.getItem('futureScenarios');
      if (savedScenarios) {
        return JSON.parse(savedScenarios);
      }
    } catch (e) {
      console.error("Failed to parse scenarios from localStorage", e);
    }
    
    // No saved scenarios, so load defaults based on the setting.
    const defaultScenarios = t('scenarios', { returnObjects: true }) as Scenario[];
    if (prefillDescriptions) {
      const scenarioDefaults = t('scenarioDefaults', { returnObjects: true }) as Record<string, { description: string }>;
      return defaultScenarios.map(sc => {
        if (scenarioDefaults[sc.value] && scenarioDefaults[sc.value].description) {
          return { ...sc, description: scenarioDefaults[sc.value].description };
        }
        return sc;
      });
    }
    // If prefill is off, return defaults with empty descriptions.
    return defaultScenarios;
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScenariosLength = useRef(scenarios.length);

  useEffect(() => {
    // Scroll to bottom only when a new scenario is added
    if (scenarios.length > prevScenariosLength.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
    // Update the ref for the next render
    prevScenariosLength.current = scenarios.length;
  }, [scenarios.length]);


  const handleFieldChange = (index: number, field: 'label' | 'description', value: string) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = { ...newScenarios[index], [field]: value };
    setScenarios(newScenarios);
  };

  const handleAddScenario = () => {
    setScenarios([
      ...scenarios,
      {
        label: t('scenarioForm.newScenarioLabel'),
        value: crypto.randomUUID(),
        description: t('scenarioForm.newScenarioDescription'),
      },
    ]);
  };

  const handleRemoveScenario = (index: number) => {
    const newScenarios = scenarios.filter((_, i) => i !== index);
    setScenarios(newScenarios);
  };

  const handleSaveChanges = () => {
    localStorage.setItem('futureScenarios', JSON.stringify(scenarios));
    onSave(scenarios);
  };

  return (
    <main className="mt-8 p-6 bg-gray-800 bg-opacity-50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4 flex items-center gap-3">
        <PencilIcon className="w-8 h-8" />
        {t('scenarioForm.title')}
      </h2>
      <div ref={scrollContainerRef} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {scenarios.map((scenario, index) => (
          <div key={scenario.value} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-200">
                {scenario.label || `${t('scenarioForm.scenario')} #${index + 1}`}
              </h3>
              <button
                onClick={() => handleRemoveScenario(index)}
                disabled={scenarios.length <= 1}
                className="text-red-500 hover:text-red-400 disabled:text-gray-500 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
                aria-label={t('scenarioForm.removeAria', { label: scenario.label })}
              >
                {t('scenarioForm.remove')}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor={`label-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                  {t('scenarioForm.scenarioLabel')}
                </label>
                <input
                  type="text"
                  id={`label-${index}`}
                  value={scenario.label}
                  onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                  placeholder={t('scenarioForm.labelPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                  {t('scenarioForm.scenarioDescription')}
                </label>
                <textarea
                  id={`description-${index}`}
                  rows={6}
                  value={scenario.description}
                  onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                  placeholder={t('scenarioForm.descriptionPlaceholder')}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddScenario}
        className="mt-6 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
      >
        {t('scenarioForm.add')}
      </button>
      <div className="flex justify-end gap-4 mt-8 border-t border-gray-700 pt-6">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 px-6 rounded-lg transition-all"
        >
          {t('scenarioForm.cancel')}
        </button>
        <button
          onClick={handleSaveChanges}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-2 px-6 rounded-lg transition-all"
        >
          {t('scenarioForm.save')}
        </button>
      </div>
    </main>
  );
};