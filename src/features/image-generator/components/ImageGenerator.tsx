import React, { useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import { ImageDisplay } from './ImageDisplay';
import { ScenarioSelector } from './ScenarioSelector';
import { ImageMaskEditor } from './ImageMaskEditor';
import { imageGenerationService } from '../../../services/image-generation';
import { Scenario } from '../constants';
import { PlusIcon, SpinnerIcon, BrushIcon } from '../../../components/ui/Icons';

interface ImageGeneratorProps {
    scenarios: Scenario[];
    onManageScenarios: () => void;
    customPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
    // Lifted state props
    originalImage: File | null;
    originalImageUrl: string | null;
    generatedImageUrls: string[] | null;
    selectedGeneratedImageIndex: number;
    selectedScenarioValue: string;
    onImageUpload: (file: File) => void;
    onGeneratedImageUrlsChange: (urls: string[] | null) => void;
    onSelectedGeneratedImageIndexChange: (index: number) => void;
    onSelectedScenarioValueChange: (value: string) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
    scenarios, 
    onManageScenarios, 
    customPrompt, 
    onCustomPromptChange,
    originalImage,
    originalImageUrl,
    generatedImageUrls,
    selectedGeneratedImageIndex,
    selectedScenarioValue,
    onImageUpload,
    onGeneratedImageUrlsChange,
    onSelectedGeneratedImageIndexChange,
    onSelectedScenarioValueChange,
}) => {
  // Local state for UI interactions within this component
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showModificationUI, setShowModificationUI] = useState<boolean>(false);
  const [modificationPrompt, setModificationPrompt] = useState<string>('');
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
  const [imageToEditUrl, setImageToEditUrl] = useState<string | null>(null);

  const selectedScenario = scenarios.find(s => s.value === selectedScenarioValue) || scenarios[0];
  const selectedGeneratedImageUrl = generatedImageUrls ? generatedImageUrls[selectedGeneratedImageIndex] : null;
  const futureYearValue = 25;
  const futureYearLabel = '25 Anos';
  
  const handleScenarioChange = (scenario: Scenario) => {
    onSelectedScenarioValueChange(scenario.value);
  };

  const handleImageUpload = (file: File) => {
    onImageUpload(file);
    // Reset local UI state when a new image is uploaded
    setError(null);
    setShowModificationUI(false);
    setModificationPrompt('');
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
    onGeneratedImageUrlsChange(null);
    onSelectedGeneratedImageIndexChange(0);
    setShowModificationUI(false);

    try {
      const generatedImageBase64Array = await imageGenerationService.generateInitialImages(originalImage, futureYearValue, selectedScenario, customPrompt);
      onGeneratedImageUrlsChange(generatedImageBase64Array.map(b64 => `data:image/png;base64,${b64}`));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, selectedScenario, customPrompt, isPromptProvided, onGeneratedImageUrlsChange, onSelectedGeneratedImageIndexChange]);

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
      const newImageBase64 = await imageGenerationService.refineImageWithText(selectedGeneratedImageUrl, selectedScenario, modificationPrompt, customPrompt);
      const newImageUrl = `data:image/png;base64,${newImageBase64}`;
      const updatedUrls = [...generatedImageUrls];
      updatedUrls[selectedGeneratedImageIndex] = newImageUrl;
      onGeneratedImageUrlsChange(updatedUrls);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [generatedImageUrls, selectedGeneratedImageIndex, selectedGeneratedImageUrl, selectedScenario, modificationPrompt, customPrompt, onGeneratedImageUrlsChange]);

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
        const editedImageBase64 = await imageGenerationService.refineImageWithMask(imageToEditUrl, maskBase64, prompt);
        const newImageUrl = `data:image/png;base64,${editedImageBase64}`;

        const updatedUrls = [...generatedImageUrls];
        updatedUrls[selectedGeneratedImageIndex] = newImageUrl;

        onGeneratedImageUrlsChange(updatedUrls);
        handleCloseMaskEditor();
        setShowModificationUI(false);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Um erro desconhecido ocorreu durante a edição mágica.');
      } finally {
        setIsLoading(false);
      }
  };


  return (
    <>
      <main className="mt-8 p-6 flex-grow flex flex-col bg-gray-800 bg-opacity-50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-8 items-stretch flex-grow">
          <ImageUploader 
            onImageUpload={handleImageUpload} 
            imageUrl={originalImageUrl}
            className="md:col-span-3"
          />

          <div className="flex flex-col gap-6 md:col-span-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-300">2. Escolha um cenário</h2>
                <button
                  onClick={onManageScenarios}
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
                  onChange={(e) => onCustomPromptChange(e.target.value)}
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

          <ImageDisplay
            title="3. Veja o Resultado"
            subtitle={generatedImageUrls ? `Futuro: +${futureYearLabel} (${selectedScenario.label}) - Variação ${selectedGeneratedImageIndex + 1}/${generatedImageUrls.length}` : undefined}
            originalImageUrl={originalImageUrl}
            imageUrls={generatedImageUrls}
            isLoading={isLoading}
            className="md:col-span-3"
            onModifyClick={selectedGeneratedImageUrl ? () => setShowModificationUI(prev => !prev) : undefined}
            selectedImageIndex={selectedGeneratedImageIndex}
            onSelectImageIndex={onSelectedGeneratedImageIndexChange}
          />
        </div>
      </main>
      {isMaskEditorOpen && imageToEditUrl && (
        <ImageMaskEditor
          imageUrl={imageToEditUrl}
          onClose={handleCloseMaskEditor}
          onGenerate={handleMagicEditGenerate}
          isLoading={isLoading}
        />
      )}
    </>
  );
};
