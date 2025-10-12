import React, { useState } from 'react';

interface SettingsPageProps {
  initialNumberOfGenerations: number;
  initialIsDevMode: boolean;
  onSave: (settings: { numberOfGenerations: number; isDevMode: boolean }) => void;
  onCancel: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ initialNumberOfGenerations, initialIsDevMode, onSave, onCancel }) => {
  const [numberOfGenerations, setNumberOfGenerations] = useState(initialNumberOfGenerations);
  const [isDevMode, setIsDevMode] = useState(initialIsDevMode);

  const handleSave = () => {
    onSave({ numberOfGenerations, isDevMode });
  };

  const handleReset = () => {
    // Esses são os valores padrão da aplicação definidos em HomePage.tsx
    setNumberOfGenerations(3);
    setIsDevMode(true);
  };

  const generationOptions = [1, 2, 3, 4];

  return (
    <main className="mt-8 p-6 bg-gray-800 bg-opacity-50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
        Configurações do Aplicativo
      </h2>
      
      <div className="space-y-6">
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            Geração de Imagem
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Número de imagens geradas por vez
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
              Escolha quantas variações de imagem serão criadas a cada clique em "Re-imagine O Futuro".
            </p>
          </div>
        </div>
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">
            Modo de Desenvolvedor
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Modo DEV
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
                  Ativado
                </button>
                <button
                  onClick={() => setIsDevMode(false)}
                  className={`px-6 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 ${
                    !isDevMode
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Desativado
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Quando ativado, o aplicativo gera imagens de teste localmente sem usar a API Gemini.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 mt-8 border-t border-gray-700 pt-6">
        <button
            onClick={handleReset}
            className="mr-auto bg-red-800 hover:bg-red-700 text-gray-200 font-bold py-2 px-6 rounded-lg transition-all text-sm"
            title="Reseta as configurações para os valores padrão"
        >
          Resetar Padrões
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 px-6 rounded-lg transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-2 px-6 rounded-lg transition-all"
        >
          Salvar Configurações
        </button>
      </div>
    </main>
  );
};
