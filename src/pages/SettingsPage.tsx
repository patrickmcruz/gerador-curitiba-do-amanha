import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GearIcon } from '../components/ui/Icons';

interface SettingsPageProps {
  initialNumberOfGenerations: number;
  initialIsDevMode: boolean;
  initialPrefillDescriptions: boolean;
  initialTimeDirection: 'future' | 'past';
  initialTimeYears: number;
  onSave: (settings: { 
    numberOfGenerations: number; 
    isDevMode: boolean; 
    prefillDescriptions: boolean; 
    timeDirection: 'future' | 'past';
    timeYears: number;
  }) => void;
  onCancel: () => void;
  onPrefillDescriptionsChange: (value: boolean) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  initialNumberOfGenerations, 
  initialIsDevMode, 
  initialPrefillDescriptions, 
  initialTimeDirection,
  initialTimeYears,
  onSave, 
  onCancel,
  onPrefillDescriptionsChange
}) => {
  const { t, i18n } = useTranslation();
  const [numberOfGenerations, setNumberOfGenerations] = useState(initialNumberOfGenerations);
  const [isDevMode, setIsDevMode] = useState(initialIsDevMode);
  const [prefillDescriptions, setPrefillDescriptions] = useState(initialPrefillDescriptions);
  const [timeDirection, setTimeDirection] = useState<'future' | 'past'>(initialTimeDirection);
  const [timeYears, setTimeYears] = useState(initialTimeYears);

  const handleSave = () => {
    onSave({ 
        numberOfGenerations, 
        isDevMode, 
        prefillDescriptions,
        timeDirection,
        timeYears: timeYears > 0 ? timeYears : 1, // Ensure years is at least 1
    });
  };

  const handleReset = () => {
    setNumberOfGenerations(3);
    setIsDevMode(true);
    setPrefillDescriptions(false);
    setTimeDirection('future');
    setTimeYears(25);
    i18n.changeLanguage('pt-BR');
  };

  const handlePrefillChange = (value: boolean) => {
    setPrefillDescriptions(value);
    onPrefillDescriptionsChange(value);
  };

  const generationOptions = [1, 2, 3, 4];

  return (
    <main className="mt-8 p-6 bg-gray-800 bg-opacity-50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4 flex items-center gap-3">
        <GearIcon className="w-8 h-8" />
        {t('settings.title')}
      </h2>
      
      <div className="space-y-6">
      <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            {t('settings.language.title')}
          </h3>
          <div className="flex gap-3">
            <button
                onClick={() => i18n.changeLanguage('pt-BR')}
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue ${
                  i18n.language.startsWith('pt')
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              {t('settings.language.pt-BR')}
            </button>
            <button
                onClick={() => i18n.changeLanguage('en')}
                className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue ${
                  i18n.language === 'en'
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              {t('settings.language.en')}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {t('settings.language.description')}
          </p>
        </div>
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            {t('settings.timeTravel.title')}
          </h3>
          <div className="flex flex-col md:flex-row md:items-end gap-y-4 md:gap-x-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('settings.timeTravel.directionLabel')}
                </label>
                <div className="flex gap-3">
                    <button
                        onClick={() => setTimeDirection('future')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue ${
                            timeDirection === 'future'
                            ? 'bg-brand-blue text-white shadow-md'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        >
                        {t('settings.timeTravel.future')}
                    </button>
                    <button
                        onClick={() => setTimeDirection('past')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue ${
                            timeDirection === 'past'
                            ? 'bg-brand-blue text-white shadow-md'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        >
                        {t('settings.timeTravel.past')}
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="time-years" className="block text-sm font-medium text-gray-300 mb-2">
                    {t('settings.timeTravel.yearsLabel')}
                </label>
                <input
                  type="number"
                  id="time-years"
                  value={timeYears}
                  onChange={(e) => setTimeYears(parseInt(e.target.value, 10))}
                  min="0"
                  max="1000"
                  className="w-full md:w-32 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {t('settings.timeTravel.description')}
          </p>
        </div>
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            {t('settings.imageGeneration.title')}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('settings.imageGeneration.label')}
            </label>
            <div className="flex gap-3">
              {generationOptions.map(num => (
                <button
                  key={num}
                  onClick={() => setNumberOfGenerations(num)}
                  className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-purple ${
                    numberOfGenerations === num
                      ? 'bg-brand-purple text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t('settings.imageGeneration.description')}
            </p>
          </div>
        </div>
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            {t('settings.scenarioDefaults.title')}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('settings.scenarioDefaults.label')}
            </label>
            <div className="flex gap-3">
                <button
                  onClick={() => handlePrefillChange(true)}
                  className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 ${
                    prefillDescriptions
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t('settings.scenarioDefaults.on')}
                </button>
                <button
                  onClick={() => handlePrefillChange(false)}
                  className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 ${
                    !prefillDescriptions
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t('settings.scenarioDefaults.off')}
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t('settings.scenarioDefaults.description')}
            </p>
          </div>
        </div>
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            {t('settings.devMode.title')}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('settings.devMode.label')}
            </label>
            <div className="flex gap-3">
                <button
                  onClick={() => setIsDevMode(true)}
                  className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 ${
                    isDevMode
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t('settings.devMode.on')}
                </button>
                <button
                  onClick={() => setIsDevMode(false)}
                  className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 ${
                    !isDevMode
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t('settings.devMode.off')}
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t('settings.devMode.description')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 mt-8 border-t border-gray-700 pt-6">
        <button
            onClick={handleReset}
            className="mr-auto bg-red-800 hover:bg-red-700 text-gray-200 font-bold py-2 px-6 rounded-lg transition-all text-sm"
            title={t('settings.buttons.reset')}
        >
          {t('settings.buttons.reset')}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 px-6 rounded-lg transition-all"
        >
          {t('settings.buttons.cancel')}
        </button>
        <button
          onClick={handleSave}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-2 px-6 rounded-lg transition-all"
        >
          {t('settings.buttons.save')}
        </button>
      </div>
    </main>
  );
};