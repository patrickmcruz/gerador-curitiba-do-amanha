import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageUploader } from './ImageUploader';
import { ImageDisplay } from './ImageDisplay';
import { ScenarioSelector } from './ScenarioSelector';
import { ImageMaskEditor } from './ImageMaskEditor';
import { GenerationHistoryPanel } from './GenerationHistoryPanel';
import { imageGenerationService } from '../../../services/image-generation';
import { Scenario, HistoryEntry } from '../constants';
import { SpinnerIcon, BrushIcon, SparklesIcon, ClockIcon, PencilIcon, RefreshIcon, CloseIcon, UndoIcon, RedoIcon } from '../../../components/ui/Icons';

interface ImageGeneratorProps {
    scenarios: Scenario[];
    onManageScenarios: () => void;
    onSettingsClick: () => void;
    customPrompt: string;
    onCustomPromptChange: (value: string) => void;
    numberOfGenerations: number;
    isDevMode: boolean;
    timeDirection: 'future' | 'past';
    timeYears: number;
    originalImage: File | null;
    originalImageUrl: string | null;
    generatedImageUrls: string[] | null;
    selectedGeneratedImageIndex: number;
    selectedScenarioValue: string;
    onImageUpload: (file: File) => void;
    onGeneratedImageUrlsChange: (urls: string[] | null) => void;
    onSelectedGeneratedImageIndexChange: (index: number) => void;
    onSelectedScenarioValueChange: (value: string) => void;
    undoImageUrl: string | null;
    undoIndex: number | null;
    redoImageUrl: string | null;
    redoIndex: number | null;
    onUndoImageUrlChange: (url: string | null) => void;
    onUndoIndexChange: (index: number | null) => void;
    onRedoImageUrlChange: (url: string | null) => void;
    onRedoIndexChange: (index: number | null) => void;
    generationHistory: HistoryEntry[];
    onGenerationHistoryChange: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
    historySnapshots: Record<string, string[]>;
    onHistorySnapshotsChange: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    onUndoPrompt: () => void;
    onRedoPrompt: () => void;
    canUndoPrompt: boolean;
    canRedoPrompt: boolean;
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
  
          ctx.drawImage(img, 0, 0);
  
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

            const padding = fontSize * 0.5;
            const totalHeight = lines.length * lineHeight;
            const maxLineWidth = lines.reduce((max, l) => Math.max(max, context.measureText(l).width), 0);
            
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(
                x - maxLineWidth / 2 - padding, 
                y - totalHeight / 2 - padding, 
                maxLineWidth + padding * 2, 
                totalHeight + padding * 2
            );
            
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
    onSettingsClick,
    customPrompt, 
    onCustomPromptChange,
    numberOfGenerations,
    isDevMode,
    timeDirection,
    timeYears,
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
    onUndoPrompt,
    onRedoPrompt,
    canUndoPrompt,
    canRedoPrompt,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showModificationUI, setShowModificationUI] = useState<boolean>(false);
  const [isRefiningInFullScreen, setIsRefiningInFullScreen] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState<string>('');
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
  const [imageToEditUrl, setImageToEditUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const selectedScenario = scenarios.find(s => s.value === selectedScenarioValue) || scenarios[0];
  const selectedGeneratedImageUrl = generatedImageUrls ? generatedImageUrls[selectedGeneratedImageIndex] : null;

  const getNewSuggestions = useCallback((scenarioValue: string) => {
    const suggestionsKey = `promptSuggestions.${scenarioValue}`;
    const allSuggestions = t(suggestionsKey, { returnObjects: true }) as string[] | undefined;
    if (Array.isArray(allSuggestions)) {
      const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random());
      setCurrentSuggestions(shuffled.slice(0, 3));
    } else {
        setCurrentSuggestions([]);
    }
  }, [t]);

  useEffect(() => {
    if (selectedScenarioValue) {
        getNewSuggestions(selectedScenarioValue);
    }
  }, [selectedScenarioValue, getNewSuggestions]);
  
  const handleScenarioChange = (scenario: Scenario) => {
    onSelectedScenarioValueChange(scenario.value);
  };

  const handleImageUpload = (file: File) => {
    onImageUpload(file);
    setError(null);
    setShowModificationUI(false);
    setModificationPrompt('');
    setActiveTab('result');
  };

  const handleSuggestionClick = (suggestion: string) => {
    // FIX: Pass the new string value to onCustomPromptChange instead of a function.
    onCustomPromptChange(customPrompt ? `${customPrompt}, ${suggestion}` : suggestion);
  };
  
  const isPromptProvided = selectedScenario?.description?.trim() !== '' || customPrompt.trim() !== '';

  const handleGenerateClick = useCallback(async () => {
    if (!originalImage || !selectedScenario) {
      setError(t('imageGenerator.uploadError'));
      return;
    }
    
    if (!isPromptProvided) {
      setError(t('imageGenerator.promptError'));
      return;
    }

    const isFirstGeneration = generationHistory.length === 0;

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
    
    const promptKey = timeDirection === 'future' ? 'prompts.initialFuture' : 'prompts.initialPast';
    const fullPrompt = t(promptKey, {
        year: timeYears,
        scenarioLabel: selectedScenario.label,
        scenarioDescription: selectedScenario.description,
        customPrompt: customPrompt,
      });

    const mockPrompt = [
        `Scenario: ${selectedScenario.label}`,
        selectedScenario.description,
        customPrompt
    ].filter(Boolean).join(' | ');

    if (isDevMode) {
      setTimeout(async () => {
        if (originalImage) {
          try {
            const mockPromises = Array.from({ length: numberOfGenerations }, (_, i) => 
                createMockImageWithText(originalImage, `[DEV MOCK ${i + 1}] ${mockPrompt}`)
            );

            const mockUrls = await Promise.all(mockPromises);
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

            if (isFirstGeneration) {
                setIsFullScreen(true);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create mock DEV image');
          }
        }
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const generatedImageBase64Array = await imageGenerationService.generateInitialImages(originalImage, fullPrompt, numberOfGenerations);
      const newUrls = generatedImageBase64Array.map(b64 => `data:image/png;base64,${b64}`);
      onGeneratedImageUrlsChange(newUrls);

      const thumbnailUrl = await createThumbnail(newUrls[0]);
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

      if (isFirstGeneration) {
        setIsFullScreen(true);
      }
    } catch (err) {
      console.error(err);
      const errorKey = err instanceof Error ? err.message : 'apiErrors.unknown';
      setError(t(errorKey));
    } finally {
      setIsLoading(false);
    }
  }, [isDevMode, originalImage, selectedScenario, customPrompt, isPromptProvided, onGeneratedImageUrlsChange, onSelectedGeneratedImageIndexChange, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange, onGenerationHistoryChange, onHistorySnapshotsChange, numberOfGenerations, t, generationHistory, timeDirection, timeYears]);

  const handleModificationGenerateClick = useCallback(async () => {
    if (!selectedGeneratedImageUrl || !generatedImageUrls || !selectedScenario) {
      setError(t('imageGenerator.refineSelectionError'));
      return;
    }
    if (!modificationPrompt.trim()) {
      setError(t('imageGenerator.refineError'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveTab('result');
    
    const fullPrompt = t('prompts.refineWithText', {
        scenarioLabel: selectedScenario.label,
        customPrompt: customPrompt,
        modificationPrompt: modificationPrompt,
    });

    const mockPrompt = `Refine: ${modificationPrompt}`;

    if (isDevMode) {
        setTimeout(async () => {
          if (originalImage && generatedImageUrls) {
            try {
              const newMockUrl = await createMockImageWithText(originalImage, `[DEV MOCK VARIAÇÃO] ${mockPrompt}`);
              const imageToUndo = selectedGeneratedImageUrl;
              const updatedUrls = [...generatedImageUrls];
              updatedUrls[selectedGeneratedImageIndex] = newMockUrl;
              
              onUndoImageUrlChange(imageToUndo);
              onUndoIndexChange(selectedGeneratedImageIndex);
              onRedoImageUrlChange(null);
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
      const newImageBase64 = await imageGenerationService.refineImageWithText(selectedGeneratedImageUrl, fullPrompt);
      const newImageUrl = `data:image/png;base64,${newImageBase64}`;
      
      const updatedUrls = [...generatedImageUrls];
      updatedUrls[selectedGeneratedImageIndex] = newImageUrl;
      
      onUndoImageUrlChange(imageToUndo);
      onUndoIndexChange(selectedGeneratedImageIndex);
      onRedoImageUrlChange(null);
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
        const errorKey = err instanceof Error ? err.message : 'apiErrors.unknown';
        setError(t(errorKey));
    } finally {
      setIsLoading(false);
    }
  }, [isDevMode, originalImage, generatedImageUrls, selectedGeneratedImageIndex, selectedGeneratedImageUrl, selectedScenario, modificationPrompt, customPrompt, onGeneratedImageUrlsChange, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange, onGenerationHistoryChange, onHistorySnapshotsChange, t]);

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
        setError(t('apiErrors.unknown'));
        return;
      }
  
      setIsLoading(true);
      setError(null);
      setActiveTab('result');

      const fullPrompt = t('prompts.refineWithMask', { prompt });
      const mockPrompt = `Magic Edit: ${prompt}`;

      if (isDevMode) {
        setTimeout(async () => {
          if (originalImage && generatedImageUrls) {
            try {
              const newMockUrl = await createMockImageWithText(originalImage, `[DEV MOCK MÁGICA] ${mockPrompt}`);
              const imageToUndo = imageToEditUrl;
              const updatedUrls = [...generatedImageUrls];
              updatedUrls[selectedGeneratedImageIndex] = newMockUrl;
  
              onUndoImageUrlChange(imageToUndo);
              onUndoIndexChange(selectedGeneratedImageIndex);
              onRedoImageUrlChange(null);
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
        const editedImageBase64 = await imageGenerationService.refineImageWithMask(imageToEditUrl, maskBase64, fullPrompt);
        const newImageUrl = `data:image/png;base64,${editedImageBase64}`;

        const updatedUrls = [...generatedImageUrls];
        updatedUrls[selectedGeneratedImageIndex] = newImageUrl;

        onUndoImageUrlChange(imageToUndo);
        onUndoIndexChange(selectedGeneratedImageIndex);
        onRedoImageUrlChange(null);
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
        const errorKey = err instanceof Error ? err.message : 'apiErrors.unknown';
        setError(t(errorKey));
      } finally {
        setIsLoading(false);
      }
  }, [isDevMode, originalImage, imageToEditUrl, generatedImageUrls, selectedGeneratedImageIndex, onGeneratedImageUrlsChange, handleCloseMaskEditor, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange, onGenerationHistoryChange, onHistorySnapshotsChange, t]);

  const handleUndoClick = useCallback(() => {
    if (undoImageUrl && undoIndex !== null && generatedImageUrls) {
        const currentImageUrl = generatedImageUrls[undoIndex];
        const updatedUrls = [...generatedImageUrls];
        updatedUrls[undoIndex] = undoImageUrl;
        onGeneratedImageUrlsChange(updatedUrls);
        
        onRedoImageUrlChange(currentImageUrl);
        onRedoIndexChange(undoIndex);
        
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

      onUndoImageUrlChange(currentImageUrl);
      onUndoIndexChange(redoIndex);

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
        setError(t('history.revertError'));
    }
  }, [historySnapshots, onGeneratedImageUrlsChange, onSelectedGeneratedImageIndexChange, onUndoImageUrlChange, onUndoIndexChange, onRedoImageUrlChange, onRedoIndexChange, t]);

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
            onSettingsClick={onSettingsClick}
            className="md:col-span-3"
          />

          <div className="flex flex-col gap-6 md:col-span-2">
            <div>
              <div className="flex justify-between items-center border-b border-gray-700 mb-2">
                <h2 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-blue border-b-2 border-brand-blue rounded-t-lg -mb-px">
                  {t('imageGenerator.scenarioTitle')}
                </h2>
                <button
                  onClick={onManageScenarios}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg text-gray-400 border-transparent hover:text-white"
                  aria-label={t('imageGenerator.manageScenarios')}
                  title={t('imageGenerator.manageScenarios')}
                >
                  <PencilIcon />
                  <span>{t('imageGenerator.manageScenarios')}</span>
                </button>
              </div>
              <ScenarioSelector
                scenarios={scenarios}
                selectedScenario={selectedScenario}
                onScenarioChange={handleScenarioChange}
              />
              <div className="mt-8">
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="prompt-suggestions" className="block text-sm font-medium text-gray-300">
                        {t('imageGenerator.promptSuggestions')}
                    </label>
                    <button 
                        onClick={() => getNewSuggestions(selectedScenarioValue)}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                        title={t('imageGenerator.newSuggestions')}
                    >
                        <RefreshIcon />
                    </button>
                </div>
                <div id="prompt-suggestions" className="flex flex-wrap gap-2">
                    {currentSuggestions.map((suggestion, index) => (
                        <button 
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 hover:text-white transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
              </div>
               <div className="mt-8">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-300">
                    {t('imageGenerator.customPromptLabel')}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                        onClick={onUndoPrompt}
                        disabled={!canUndoPrompt}
                        className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors p-1 rounded-full hover:bg-gray-700"
                        title={t('imageGenerator.undoPrompt')}
                        aria-label={t('imageGenerator.undoPrompt')}
                    >
                        <UndoIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRedoPrompt}
                        disabled={!canRedoPrompt}
                        className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors p-1 rounded-full hover:bg-gray-700"
                        title={t('imageGenerator.redoPrompt')}
                        aria-label={t('imageGenerator.redoPrompt')}
                    >
                        <RedoIcon className="w-4 h-4" />
                    </button>
                    {customPrompt && (
                      <button
                        onClick={() => onCustomPromptChange('')}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                        title={t('imageGenerator.clearPrompt')}
                        aria-label={t('imageGenerator.clearPrompt')}
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => onCustomPromptChange(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                  placeholder={t('imageGenerator.customPromptPlaceholder')}
                />
              </div>
            </div>
            
            {showModificationUI ? (
              <div className="animate-fade-in flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-gray-300">{t('imageGenerator.refineTitle')}</h2>
                <button
                  onClick={() => handleOpenMaskEditor(selectedGeneratedImageUrl!)}
                  disabled={isLoading || !selectedGeneratedImageUrl}
                  className="w-full flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <BrushIcon />
                  {t('imageGenerator.editWithMask')}
                </button>
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-600"></div>
                  <span className="flex-shrink mx-4 text-gray-500 text-sm">{t('imageGenerator.or')}</span>
                  <div className="flex-grow border-t border-gray-600"></div>
                </div>
                <textarea
                  value={modificationPrompt}
                  onChange={(e) => setModificationPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                  placeholder={t('imageGenerator.refinePlaceholder')}
                />
                <button
                  onClick={handleModificationGenerateClick}
                  disabled={!modificationPrompt || isLoading || !selectedGeneratedImageUrl}
                  className="w-full flex justify-center items-center gap-2 bg-brand-purple hover:bg-brand-purple/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-brand-purple/20"
                >
                  {isLoading ? (
                    <>
                      <SpinnerIcon />
                      {t('imageGenerator.refiningButton')}
                    </>
                  ) : (
                    t('imageGenerator.refineButton')
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
                        {t('imageGenerator.generatingButton')}
                      </>
                    ) : (
                        t('imageGenerator.generateButton')
                    )}
                </button>
                {!isPromptProvided && originalImage && !isLoading && (
                  <p className="text-yellow-400 text-center text-sm mt-2">
                    {t('imageGenerator.promptError')}
                  </p>
                )}
              </div>
            )}
            {error && <p className="text-red-400 text-center mt-2">{error}</p>}
          </div>

          <div className="md:col-span-3 flex flex-col h-full">
            <div className="flex justify-between items-center border-b border-gray-700 mb-2">
                <h2 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-blue">
                    {t('imageGenerator.resultTitle')}
                </h2>
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('result')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg ${
                            activeTab === 'result' ? 'text-white border-b-2 border-brand-blue -mb-px' : 'text-gray-400 hover:text-white'
                        }`}
                        >
                        <SparklesIcon />
                        {t('imageGenerator.tabResult')}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg ${
                            activeTab === 'history' ? 'text-white border-b-2 border-brand-blue -mb-px' : 'text-gray-400 hover:text-white'
                        }`}
                        >
                        <ClockIcon />
                        {t('imageGenerator.tabHistory')}
                    </button>
                </div>
            </div>
            
            {activeTab === 'result' ? (
              <ImageDisplay
                scenarioLabel={generatedImageUrls ? selectedScenario?.label : undefined}
                timeDirection={timeDirection}
                timeYears={timeYears}
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
                isFullScreen={isFullScreen}
                onIsFullScreenChange={setIsFullScreen}
              />
            ) : (
              <GenerationHistoryPanel 
                history={generationHistory}
                snapshots={historySnapshots}
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
