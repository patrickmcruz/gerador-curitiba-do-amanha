import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImageDisplay } from './components/ImageDisplay';
import { Footer } from './components/Footer';
import { generateInitialImages, refineImageWithMask, refineImageWithText } from './services/geminiService';
import { Scenario } from './types';
import { SCENARIOS } from './constants';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { ScenarioForm } from './components/ScenarioForm';
import { PlusIcon } from './components/icons/PlusIcon';
import { ImageMaskEditor } from './components/ImageMaskEditor';
import { BrushIcon } from './components/icons/BrushIcon';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenarios, selectedScenario, onScenarioChange }) => {
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

const App: React.FC = () => {
  const [page, setPage] = useState<'main' | 'form'>('main');

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const savedScenarios = localStorage.getItem('futureScenarios');
      return savedScenarios ? JSON.parse(savedScenarios) : SCENARIOS;
    } catch (e) {
      console.error("Failed to parse scenarios from localStorage", e);
      return SCENARIOS;
    }
  });

  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[] | null>(null);
  const [selectedGeneratedImageIndex, setSelectedGeneratedImageIndex] = useState<number>(0);
  const [selectedScenarioValue, setSelectedScenarioValue] = useState<string>(scenarios[0].value);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // State for image modification feature
  const [showModificationUI, setShowModificationUI] = useState<boolean>(false);
  const [modificationPrompt, setModificationPrompt] = useState<string>('');

  // State for Magic Edit (Masking) feature
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
  const [imageToEditUrl, setImageToEditUrl] = useState<string | null>(null);

  const selectedScenario = scenarios.find(s => s.value === selectedScenarioValue) || scenarios[0];
  const selectedGeneratedImageUrl = generatedImageUrls ? generatedImageUrls[selectedGeneratedImageIndex] : null;
  const futureYearValue = 25;
  const futureYearLabel = '25 Anos';
  
  const handleScenarioChange = (scenario: Scenario) => {
    setSelectedScenarioValue(scenario.value);
  };

  useEffect(() => {
    if (!scenarios.find(s => s.value === selectedScenarioValue)) {
      setSelectedScenarioValue(scenarios[0]?.value || '');
    }
  }, [scenarios, selectedScenarioValue]);

  const handleImageUpload = (file: File) => {
    setOriginalImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setGeneratedImageUrls(null);
    setSelectedGeneratedImageIndex(0);
    setError(null);
    setShowModificationUI(false); // Reset modification UI on new image
    setModificationPrompt('');   // Reset modification prompt
  };
  
  const isPromptProvided = selectedScenario?.description?.trim() !== '' || customPrompt.trim() !== '';

  const handleGenerateClick = useCallback(async () => {
    if (!originalImage) {
      setError('Please upload an image first.');
      return;
    }
    
    if (!isPromptProvided) {
      setError('Por favor, adicione uma descrição ao cenário ou preencha o Prompt Customizado.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrls(null);
    setSelectedGeneratedImageIndex(0);
    setShowModificationUI(false); // Hide modification UI on a fresh generation

    try {
      const generatedImageBase64Array = await generateInitialImages(originalImage, futureYearValue, selectedScenario, customPrompt);
      setGeneratedImageUrls(generatedImageBase64Array.map(b64 => `data:image/png;base64,${b64}`));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, selectedScenario, customPrompt, isPromptProvided]);

  const handleModificationGenerateClick = useCallback(async () => {
    if (!selectedGeneratedImageUrl || !generatedImageUrls) {
      setError('An image must be generated and selected first to create a variation.');
      return;
    }
    if (!modificationPrompt.trim()) {
      setError('Please describe the changes you want to make.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newImageBase64 = await refineImageWithText(selectedGeneratedImageUrl, selectedScenario, modificationPrompt, customPrompt);
      const newImageUrl = `data:image/png;base64,${newImageBase64}`;
      const updatedUrls = [...generatedImageUrls];
      updatedUrls[selectedGeneratedImageIndex] = newImageUrl;
      setGeneratedImageUrls(updatedUrls);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [generatedImageUrls, selectedGeneratedImageIndex, selectedGeneratedImageUrl, selectedScenario, modificationPrompt, customPrompt]);

  const handleSaveScenarios = (updatedScenarios: Scenario[]) => {
    setScenarios(updatedScenarios);
    localStorage.setItem('futureScenarios', JSON.stringify(updatedScenarios));
    setPage('main');
  };

  // Handlers for Mask Editor
  const handleOpenMaskEditor = (imageUrl: string) => {
      setImageToEditUrl(imageUrl);
      setIsMaskEditorOpen(true);
  };

  const handleCloseMaskEditor = () => {
      setIsMaskEditorOpen(false);
      setImageToEditUrl(null);
  };

  const handleMagicEditGenerate = async (maskBase64: string, prompt: string) => {
      if (!imageToEditUrl || !generatedImageUrls) {
        setError('Nenhuma imagem selecionada para edição.');
        return;
      }
  
      setIsLoading(true);
      setError(null);
      
      try {
        const editedImageBase64 = await refineImageWithMask(imageToEditUrl, maskBase64, prompt);
        const newImageUrl = `data:image/png;base64,${editedImageBase64}`;

        const updatedUrls = [...generatedImageUrls];
        updatedUrls[selectedGeneratedImageIndex] = newImageUrl;

        setGeneratedImageUrls(updatedUrls);
        handleCloseMaskEditor(); // Close editor on success
        setShowModificationUI(false); // Hide the old refine UI
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Um erro desconhecido ocorreu durante a edição mágica.');
      } finally {
        setIsLoading(false);
      }
  };


  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full mx-auto flex flex-col flex-grow">
        <Header />
        {page === 'main' ? (
          <main className="mt-8 p-6 flex-grow flex flex-col bg-gray-800 bg-opacity-50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-8 gap-8 items-stretch flex-grow">
              {/* Left Column: Input Image */}
              <ImageUploader 
                onImageUpload={handleImageUpload} 
                imageUrl={originalImageUrl}
                className="md:col-span-3"
              />

              {/* Center Column: Controls */}
              <div className="flex flex-col gap-6 md:col-span-2">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-gray-300">2. Escolha um cenário</h2>
                    <button
                      onClick={() => setPage('form')}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      aria-label="Adicionar novo cenário"
                      title="Adicionar novo cenário"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  <ScenarioSelector
                    scenarios={scenarios}
                    selectedScenario={selectedScenario}
                    onScenarioChange={handleScenarioChange}
                  />
                   <div className="mt-4">
                    <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                      Prompt Customizado (opcional)
                    </label>
                    <textarea
                      id="custom-prompt"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                      placeholder="Ex: com muitos pedestres nas calçadas, muitos carros nas vias..."
                    />
                  </div>
                </div>
                
                {showModificationUI ? (
                  <div className="animate-fade-in flex flex-col gap-3">
                    <h2 className="text-lg font-semibold text-gray-300">4. Refine o Resultado</h2>
                    <button
                      onClick={() => handleOpenMaskEditor(selectedGeneratedImageUrl!)}
                      disabled={isLoading || !selectedGeneratedImageUrl}
                      className="w-full flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <BrushIcon />
                      Editar com Máscara (Beta)
                    </button>
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-gray-600"></div>
                      <span className="flex-shrink mx-4 text-gray-500 text-sm">OU</span>
                      <div className="flex-grow border-t border-gray-600"></div>
                    </div>
                    <textarea
                      value={modificationPrompt}
                      onChange={(e) => setModificationPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                      placeholder="Ex: adicione mais pessoas, remova árvores..."
                    />
                    <button
                      onClick={handleModificationGenerateClick}
                      disabled={!modificationPrompt || isLoading || !selectedGeneratedImageUrl}
                      className="w-full flex justify-center items-center gap-2 bg-brand-purple hover:bg-brand-purple/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-brand-purple/20"
                    >
                      {isLoading ? (
                        <>
                          <SpinnerIcon />
                          Refinando...
                        </>
                      ) : (
                        'Gerar Variação (Texto)'
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleGenerateClick}
                      disabled={!originalImage || !isPromptProvided || isLoading}
                      className="w-full flex justify-center items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-brand-blue/20"
                    >
                      {isLoading ? (
                        <>
                          <SpinnerIcon />
                          Gerando o Futuro...
                        </>
                      ) : (
                        'Re-imagine O Futuro'
                      )}
                    </button>
                    {!isPromptProvided && originalImage && !isLoading && (
                      <p className="text-yellow-400 text-center text-sm mt-2">
                        Adicione uma descrição ao cenário ou um prompt customizado para continuar.
                      </p>
                    )}
                  </div>
                )}
                {error && <p className="text-red-400 text-center mt-2">{error}</p>}
              </div>

              {/* Right Column: Result */}
              <ImageDisplay
                title="3. Veja o Resultado"
                subtitle={generatedImageUrls ? `Futuro: +${futureYearLabel} (${selectedScenario.label}) - Variação ${selectedGeneratedImageIndex + 1}/${generatedImageUrls.length}` : undefined}
                originalImageUrl={originalImageUrl}
                imageUrls={generatedImageUrls}
                isLoading={isLoading}
                className="md:col-span-3"
                onModifyClick={selectedGeneratedImageUrl ? () => setShowModificationUI(prev => !prev) : undefined}
                selectedImageIndex={selectedGeneratedImageIndex}
                onSelectImageIndex={setSelectedGeneratedImageIndex}
              />
            </div>
          </main>
        ) : (
          <ScenarioForm 
            initialScenarios={scenarios}
            onSave={handleSaveScenarios}
            onCancel={() => setPage('main')}
          />
        )}
        <Footer />
      </div>
      {isMaskEditorOpen && imageToEditUrl && (
        <ImageMaskEditor
          imageUrl={imageToEditUrl}
          onClose={handleCloseMaskEditor}
          onGenerate={handleMagicEditGenerate}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default App;
