import React, { useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import { ImageDisplay } from './ImageDisplay';
import { ScenarioSelector } from './ScenarioSelector';
import { ImageMaskEditor } from './ImageMaskEditor';
import { GenerationHistoryPanel } from './GenerationHistoryPanel';
import { imageGenerationService } from '../../../services/image-generation';
import { Scenario, HistoryEntry } from '../constants';
import { SpinnerIcon, BrushIcon, SparklesIcon, ClockIcon, PencilIcon } from '../../../components/ui/Icons';

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
    // Lifted Undo/Redo state
    undoImageUrl: string | null;
    undoIndex: number | null;
    redoImageUrl: string | null;
    redoIndex: number | null;
    onUndoImageUrlChange: (url: string | null) => void;
    onUndoIndexChange: (index: number | null) => void;
    onRedoImageUrlChange: (url: string | null) => void;
    onRedoIndexChange: (index: number | null) => void;
    // History state
    generationHistory: HistoryEntry[];
    onGenerationHistoryChange: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
    historySnapshots: Record<string, string[]>;
    onHistorySnapshotsChange: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const createMockImageWithText = (imageFile: File, text: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not get canvas context'));
          }
  
          // Draw the original image
          ctx.drawImage(img, 0, 0);
  
          // --- Text rendering with wrapping ---
          const fontSize = Math.max(24, Math.round(canvas.width / 30));
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const wrapText = (context: CanvasRenderingContext2D, textToWrap: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
            const words = textToWrap.split(' ');
            let line = '';
            const lines = [];
            for(let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = context.measureText(testLine);
              const testWidth = metrics.width;
              if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
              } else {
                line = testLine;
              }
            }
            lines.push(line);

            // Calculate background size
            const padding = fontSize * 0.5;
            const totalHeight = lines.length * lineHeight;
            const maxLineWidth = lines.reduce((max, l) => Math.max(max, context.measureText(l).width), 0);
            
            // Draw background
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(
                x - maxLineWidth / 2 - padding, 
                y - totalHeight / 2 - padding, 
                maxLineWidth + padding * 2, 
                totalHeight + padding * 2
            );
            
            // Draw text
            context.fillStyle = 'white';
            let currentY = y - ((lines.length - 1) * lineHeight / 2);
            for (let i = 0; i < lines.length; i++) {
              context.fillText(lines[i].trim(), x, currentY);
              currentY += lineHeight;
            }
          }

          const maxWidth = canvas.width * 0.9;
          const lineHeight = fontSize * 1.2;
          wrapText(ctx, text, canvas.width / 2, canvas.height / 2, maxWidth, lineHeight);
          
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Image failed to load'));
        if (event.target?.result) {
            img.src = event.target.result as string;
        } else {
            reject(new Error('File could not be read.'));
        }
      };
      reader.onerror = () => reject(new Error('File reader failed'));
      reader.readAsDataURL(imageFile);
    });
};

const createThumbnail = (dataUrl: string, targetWidth: number = 128, quality: number = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            canvas.width = targetWidth;
            canvas.height = targetWidth * aspectRatio;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Image failed to load for thumbnail generation'));
        img.src = dataUrl;
    });
};

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
    undoImageUrl,
    undoIndex,
    redoImageUrl,
    redoIndex,
    onUndoImageUrlChange,
    onUndoIndexChange,
    onRedoImageUrlChange,
    onRedoIndexChange,
    generationHistory,
    onGenerationHistoryChange,
    historySnapshots,
    onHistorySnapshotsChange,
}) => {
  // Local state for UI interactions within this component
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showModificationUI, setShowModificationUI] = useState<boolean>(false);
  const [isRefiningInFullScreen, setIsRefiningInFullScreen] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState<string>('');
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
  const [imageToEditUrl, setImageToEditUrl] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');
  
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
    setActiveTab('result');
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
    onUndoImageUrlChange(null);
    onUndoIndexChange(null);
    onRedoImageUrlChange(null);
    onRedoIndexChange(null);
    setActiveTab('result');

    if (isDevMode) {
      setTimeout(async () => {
        if (originalImage) {
          try {
            const fullPrompt = `Cenário: ${selectedScenario.label}. ${customPrompt || selectedScenario.description}`;
            const mockUrls = await Promise.all([
              createMockImageWithText(originalImage, `[DEV MOCK 1] ${fullPrompt}`),
              createMockImageWithText(originalImage, `[DEV MOCK 2] ${fullPrompt}`),
              createMockImageWithText(originalImage, `[DEV MOCK 3] ${fullPrompt}`),
            ]);
            onGeneratedImageUrlsChange(mockUrls);
            const thumbnailUrl = await createThumbnail(mockUrls[0]);
            const newHistoryEntry: HistoryEntry = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'initial',
                prompt: fullPrompt,
                thumbnailUrl: thumbnailUrl,
                selectedGeneratedImageIndex: 0,
            };
            onGenerationHistoryChange(prev => [newHistoryEntry, ...prev]);
            onHistorySnapshotsChange(prev => ({ ...prev, [newHistoryEntry.id]: mockUrls }));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create mock DEV image');
          }
        }
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const generatedImageBase64Array = await imageGenerationService.generateInitialImages(originalImage, futureYearValue, selectedScenario, customPrompt);
      const newUrls = generatedImageBase64Array.map(b64 => `data:image/png;base64,${b64}`);
      onGeneratedImageUrlsChange(newUrls);

      const thumbnailUrl = await createThumbnail(newUrls[0]);
      const fullPrompt = `Cenário: ${selectedScenario.label}. ${customPrompt || selectedScenario.description}`;
      const newHistoryEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'initial',
        prompt: fullPrompt,
        thumbnailUrl: thumbnailUrl,
        selectedGeneratedImageIndex: 0,
      };
      onGenerationHistoryChange(prev => [newHistoryEntry, ...prev]);
      onHistorySnapshotsChange(prev => ({ ...prev, [newHistoryEntry.id]: newUrls }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [isDevMode, originalImage, selectedScenario, customPrompt, isPromptProvided, onGeneratedImageUrlsChange, onSelectedGeneratedImageIndexChange, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange, onGenerationHistoryChange, onHistorySnapshotsChange]);

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
    setActiveTab('result');

    if (isDevMode) {
        setTimeout(async () => {
          if (originalImage && generatedImageUrls) {
            try {
              const newMockUrl = await createMockImageWithText(originalImage, `[DEV MOCK VARIAÇÃO] ${modificationPrompt}`);
              const imageToUndo = selectedGeneratedImageUrl;
              const updatedUrls = [...generatedImageUrls];
              updatedUrls[selectedGeneratedImageIndex] = newMockUrl;
              
              onUndoImageUrlChange(imageToUndo);
              onUndoIndexChange(selectedGeneratedImageIndex);
              onRedoImageUrlChange(null); // Clear redo history on new action
              onRedoIndexChange(null);
              onGeneratedImageUrlsChange(updatedUrls);

              const thumbnailUrl = await createThumbnail(newMockUrl);
              const newHistoryEntry: HistoryEntry = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'refinement',
                prompt: modificationPrompt,
                thumbnailUrl: thumbnailUrl,
                selectedGeneratedImageIndex: selectedGeneratedImageIndex,
              };
              onGenerationHistoryChange(prev => [newHistoryEntry, ...prev]);
              onHistorySnapshotsChange(prev => ({ ...prev, [newHistoryEntry.id]: updatedUrls }));
              setIsRefiningInFullScreen(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create mock DEV image');
            }
          }
          setIsLoading(false);
        }, 500);
        return;
      }

    const imageToUndo = selectedGeneratedImageUrl;

    try {
      const newImageBase64 = await imageGenerationService.refineImageWithText(selectedGeneratedImageUrl, selectedScenario, modificationPrompt, customPrompt);
      const newImageUrl = `data:image/png;base64,${newImageBase64}`;
      
      const updatedUrls = [...generatedImageUrls];
      updatedUrls[selectedGeneratedImageIndex] = newImageUrl;
      
      onUndoImageUrlChange(imageToUndo);
      onUndoIndexChange(selectedGeneratedImageIndex);
      onRedoImageUrlChange(null); // Clear redo history on new action
      onRedoIndexChange(null);
      onGeneratedImageUrlsChange(updatedUrls);

      const thumbnailUrl = await createThumbnail(newImageUrl);
      const newHistoryEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'refinement',
        prompt: modificationPrompt,
        thumbnailUrl: thumbnailUrl,
        selectedGeneratedImageIndex: selectedGeneratedImageIndex,
      };
      onGenerationHistoryChange(prev => [newHistoryEntry, ...prev]);
      onHistorySnapshotsChange(prev => ({ ...prev, [newHistoryEntry.id]: updatedUrls }));
      setIsRefiningInFullScreen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [isDevMode, originalImage, generatedImageUrls, selectedGeneratedImageIndex, selectedGeneratedImageUrl, selectedScenario, modificationPrompt, customPrompt, onGeneratedImageUrlsChange, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange, onGenerationHistoryChange, onHistorySnapshotsChange]);

  const handleOpenMaskEditor = (imageUrl: string) => {
      setImageToEditUrl(imageUrl);
      setIsMaskEditorOpen(true);
  };

  const handleCloseMaskEditor = useCallback(() => {
      setIsMaskEditorOpen(false);
      setImageToEditUrl(null);
  }, []);

  const handleMagicEditGenerate = useCallback(async (maskBase64: string, prompt: string) => {
      if (!imageToEditUrl || !generatedImageUrls) {
        setError('Nenhuma imagem selecionada para edição.');
        return;
      }
  
      setIsLoading(true);
      setError(null);
      setActiveTab('result');

      if (isDevMode) {
        setTimeout(async () => {
          if (originalImage && generatedImageUrls) {
            try {
              const newMockUrl = await createMockImageWithText(originalImage, `[DEV MOCK MÁGICA] ${prompt}`);
              const imageToUndo = imageToEditUrl;
              const updatedUrls = [...generatedImageUrls];
              updatedUrls[selectedGeneratedImageIndex] = newMockUrl;
  
              onUndoImageUrlChange(imageToUndo);
              onUndoIndexChange(selectedGeneratedImageIndex);
              onRedoImageUrlChange(null); // Clear redo history on new action
              onRedoIndexChange(null);
              onGeneratedImageUrlsChange(updatedUrls);

              const thumbnailUrl = await createThumbnail(newMockUrl);
              const newHistoryEntry: HistoryEntry = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'mask_edit',
                prompt: prompt,
                thumbnailUrl: thumbnailUrl,
                selectedGeneratedImageIndex: selectedGeneratedImageIndex,
              };
              onGenerationHistoryChange(prev => [newHistoryEntry, ...prev]);
              onHistorySnapshotsChange(prev => ({ ...prev, [newHistoryEntry.id]: updatedUrls }));

              handleCloseMaskEditor();
              setShowModificationUI(false);
              setIsRefiningInFullScreen(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create mock DEV image');
            }
          }
          setIsLoading(false);
        }, 500);
        return;
      }

      const imageToUndo = imageToEditUrl;
      
      try {
        const editedImageBase64 = await imageGenerationService.refineImageWithMask(imageToEditUrl, maskBase64, prompt);
        const newImageUrl = `data:image/png;base64,${editedImageBase64}`;

        const updatedUrls = [...generatedImageUrls];
        updatedUrls[selectedGeneratedImageIndex] = newImageUrl;

        onUndoImageUrlChange(imageToUndo);
        onUndoIndexChange(selectedGeneratedImageIndex);
        onRedoImageUrlChange(null); // Clear redo history on new action
        onRedoIndexChange(null);
        onGeneratedImageUrlsChange(updatedUrls);

        const thumbnailUrl = await createThumbnail(newImageUrl);
        const newHistoryEntry: HistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'mask_edit',
            prompt: prompt,
            thumbnailUrl: thumbnailUrl,
            selectedGeneratedImageIndex: selectedGeneratedImageIndex,
        };
        onGenerationHistoryChange(prev => [newHistoryEntry, ...prev]);
        onHistorySnapshotsChange(prev => ({ ...prev, [newHistoryEntry.id]: updatedUrls }));
        
        handleCloseMaskEditor();
        setShowModificationUI(false);
        setIsRefiningInFullScreen(false);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Um erro desconhecido ocorreu durante a edição mágica.');
      } finally {
        setIsLoading(false);
      }
  }, [isDevMode, originalImage, imageToEditUrl, generatedImageUrls, selectedGeneratedImageIndex, onGeneratedImageUrlsChange, handleCloseMaskEditor, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange, onGenerationHistoryChange, onHistorySnapshotsChange]);

  const handleUndoClick = useCallback(() => {
    if (undoImageUrl && undoIndex !== null && generatedImageUrls) {
        const currentImageUrl = generatedImageUrls[undoIndex];
        const updatedUrls = [...generatedImageUrls];
        updatedUrls[undoIndex] = undoImageUrl;
        onGeneratedImageUrlsChange(updatedUrls);
        
        // Setup redo state
        onRedoImageUrlChange(currentImageUrl);
        onRedoIndexChange(undoIndex);
        
        // Clear undo state
        onUndoImageUrlChange(null);
        onUndoIndexChange(null);
    }
  }, [undoImageUrl, undoIndex, generatedImageUrls, onGeneratedImageUrlsChange, onRedoImageUrlChange, onRedoIndexChange, onUndoImageUrlChange, onUndoIndexChange]);
  
  const handleRedoClick = useCallback(() => {
    if (redoImageUrl && redoIndex !== null && generatedImageUrls) {
      const currentImageUrl = generatedImageUrls[redoIndex];
      const updatedUrls = [...generatedImageUrls];
      updatedUrls[redoIndex] = redoImageUrl;
      onGeneratedImageUrlsChange(updatedUrls);

      // Set up undo state again
      onUndoImageUrlChange(currentImageUrl);
      onUndoIndexChange(redoIndex);

      // Clear redo state
      onRedoImageUrlChange(null);
      onRedoIndexChange(null);
    }
  }, [redoImageUrl, redoIndex, generatedImageUrls, onGeneratedImageUrlsChange, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange]);

  const handleRevertToHistory = useCallback((entry: HistoryEntry) => {
    const snapshotUrls = historySnapshots[entry.id];
    if (snapshotUrls) {
        onGeneratedImageUrlsChange(snapshotUrls);
        onSelectedGeneratedImageIndexChange(entry.selectedGeneratedImageIndex);
        onUndoImageUrlChange(null);
        onUndoIndexChange(null);
        onRedoImageUrlChange(null);
        onRedoIndexChange(null);
        setActiveTab('result');
        setShowModificationUI(false);
    } else {
        console.error("Snapshot not found for history entry:", entry.id);
        setError("Não foi possível restaurar o histórico (snapshot não encontrado).");
    }
  }, [historySnapshots, onGeneratedImageUrlsChange, onSelectedGeneratedImageIndexChange, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange]);

  const handleClearHistory = useCallback(() => {
    onGenerationHistoryChange([]);
    onHistorySnapshotsChange({});
  }, [onGenerationHistoryChange, onHistorySnapshotsChange]);

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
              <div className="flex justify-between items-center border-b border-gray-700 mb-2">
                <h2 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-blue border-b-2 border-brand-blue rounded-t-lg -mb-px"
                >
                  2. Escolha um cenário
                </h2>
                <button
                  onClick={onManageScenarios}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg text-gray-400 border-transparent hover:text-white"
                  aria-label="Gerenciar cenários"
                  title="Gerenciar cenários"
                >
                  <PencilIcon />
                  <span>Cenários</span>
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
                <div className="flex items-center gap-2">
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
                  <button
                    type="button"
                    onClick={() => setIsDevMode(prev => !prev)}
                    className={`px-3 py-3 rounded-lg text-white font-bold transition-colors text-sm flex-shrink-0 ${isDevMode ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                    title={isDevMode ? 'Modo DEV Ativado (sem uso de API)' : 'Ativar Modo DEV'}
                  >
                    DEV
                  </button>
                </div>
                {!isPromptProvided && originalImage && !isLoading && (
                  <p className="text-yellow-400 text-center text-sm mt-2">
                    Adicione uma descrição ao cenário ou um prompt customizado para continuar.
                  </p>
                )}
              </div>
            )}
            {error && <p className="text-red-400 text-center mt-2">{error}</p>}
          </div>

          <div className="md:col-span-3 flex flex-col h-full">
            <div className="flex justify-between items-center border-b border-gray-700 mb-2">
                <h2 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-blue border-b-2 border-brand-blue rounded-t-lg -mb-px">
                    3. Veja o Resultado
                </h2>
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('result')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg ${
                            activeTab === 'result' ? 'text-white' : 'text-gray-400 hover:text-white'
                        }`}
                        >
                        <SparklesIcon />
                        Resultado
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg ${
                            activeTab === 'history' ? 'text-white' : 'text-gray-400 hover:text-white'
                        }`}
                        >
                        <ClockIcon />
                        Histórico
                    </button>
                </div>
            </div>
            
            {activeTab === 'result' ? (
              <ImageDisplay
                subtitle={generatedImageUrls ? `Futuro: +${futureYearLabel} (${selectedScenario.label}) - Variação ${selectedGeneratedImageIndex + 1}/${generatedImageUrls.length}` : undefined}
                originalImageUrl={originalImageUrl}
                imageUrls={generatedImageUrls}
                isLoading={isLoading}
                onModifyClick={selectedGeneratedImageUrl ? () => setShowModificationUI(prev => !prev) : undefined}
                selectedImageIndex={selectedGeneratedImageIndex}
                onSelectImageIndex={onSelectedGeneratedImageIndexChange}
                isUndoAvailable={undoIndex === selectedGeneratedImageIndex}
                onUndoClick={handleUndoClick}
                isRedoAvailable={redoIndex === selectedGeneratedImageIndex}
                onRedoClick={handleRedoClick}
                isRefiningInFullScreen={isRefiningInFullScreen}
                onIsRefiningInFullScreenChange={setIsRefiningInFullScreen}
                modificationPrompt={modificationPrompt}
                onModificationPromptChange={setModificationPrompt}
                onModificationGenerateClick={handleModificationGenerateClick}
                onOpenMaskEditor={handleOpenMaskEditor}
              />
            ) : (
              <GenerationHistoryPanel 
                history={generationHistory}
                onRevert={handleRevertToHistory}
                onClear={handleClearHistory}
              />
            )}
          </div>
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
