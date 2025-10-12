import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageGenerator } from '../features/image-generator/components/ImageGenerator';
import { Scenario, HistoryEntry } from '../features/image-generator/constants';
import { ScenarioForm } from '../features/image-generator/components/ScenarioForm';
import { SettingsPage } from './SettingsPage';

/**
 * Compresses an image from a data URL to a lower-quality JPEG format.
 * This is used to reduce the storage footprint in localStorage.
 * @param dataUrl The base64 data URL of the image to compress.
 * @param targetWidth The target width for the compressed image.
 * @param quality The JPEG quality (0 to 1).
 * @returns A promise that resolves with the compressed image's data URL.
 */
const compressImage = (dataUrl: string, targetWidth: number = 1024, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!dataUrl) {
            return resolve('');
        }
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            
            // Do not upscale small images, only downscale large ones
            canvas.width = Math.min(img.naturalWidth, targetWidth);
            canvas.height = canvas.width * aspectRatio;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality)); // Use JPEG for significant compression
        };
        img.onerror = () => {
            console.error('Image failed to load for compression, returning original.');
            // If the image fails to load (e.g., corrupt data URL), resolve with the original URL
            // to avoid breaking the save process.
            resolve(dataUrl);
        };
        img.src = dataUrl;
    });
};

export const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState<'main' | 'form' | 'settings'>('main');

  // State for custom prompt with undo/redo
  const [customPrompt, setCustomPromptState] = useState<string>('');
  const [promptHistory, setPromptHistory] = useState<string[]>([customPrompt]);
  const [promptHistoryIndex, setPromptHistoryIndex] = useState<number>(0);
  const promptDebounceTimeout = useRef<number | null>(null);

  const onCustomPromptChange = (newPrompt: string) => {
      setCustomPromptState(newPrompt);

      if (promptDebounceTimeout.current) {
          clearTimeout(promptDebounceTimeout.current);
      }

      promptDebounceTimeout.current = window.setTimeout(() => {
          if (promptHistory[promptHistoryIndex] !== newPrompt) {
              const newHistory = promptHistory.slice(0, promptHistoryIndex + 1);
              newHistory.push(newPrompt);
              setPromptHistory(newHistory);
              setPromptHistoryIndex(newHistory.length - 1);
          }
      }, 1000); // 1-second debounce to add to undo history
  };

  const canUndoPrompt = promptHistoryIndex > 0;
  const canRedoPrompt = promptHistoryIndex < promptHistory.length - 1;

  const handleUndoPrompt = () => {
      if (canUndoPrompt) {
          const newIndex = promptHistoryIndex - 1;
          setPromptHistoryIndex(newIndex);
          setCustomPromptState(promptHistory[newIndex]);
      }
  };

  const handleRedoPrompt = () => {
      if (canRedoPrompt) {
          const newIndex = promptHistoryIndex + 1;
          setPromptHistoryIndex(newIndex);
          setCustomPromptState(promptHistory[newIndex]);
      }
  };

  // State lifted from ImageGenerator
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[] | null>(null);
  const [selectedGeneratedImageIndex, setSelectedGeneratedImageIndex] = useState<number>(0);

  // Lifted Undo/Redo state
  const [undoImageUrl, setUndoImageUrl] = useState<string | null>(null);
  const [undoIndex, setUndoIndex] = useState<number | null>(null);
  const [redoImageUrl, setRedoImageUrl] = useState<string | null>(null);
  const [redoIndex, setRedoIndex] = useState<number | null>(null);

  // State for image history
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<HistoryEntry[]>([]);
  const [historySnapshots, setHistorySnapshots] = useState<Record<string, string[]>>({});
  
  // App settings state
  const [numberOfGenerations, setNumberOfGenerations] = useState<number>(() => {
    try {
        const savedCount = localStorage.getItem('numberOfGenerations');
        return savedCount ? parseInt(savedCount, 10) : 3;
    } catch (e) {
        console.error("Failed to parse numberOfGenerations from localStorage", e);
        return 3;
    }
  });

  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    try {
        const savedDevMode = localStorage.getItem('isDevMode');
        // Default to true if not set
        return savedDevMode ? JSON.parse(savedDevMode) : true;
    } catch (e) {
        console.error("Failed to parse isDevMode from localStorage", e);
        return true;
    }
  });

  const [prefillDescriptions, setPrefillDescriptions] = useState<boolean>(() => {
    try {
        const saved = localStorage.getItem('prefillDescriptions');
        // Default to false for new users
        return saved ? JSON.parse(saved) : false;
    } catch (e) {
        console.error("Failed to parse prefillDescriptions from localStorage", e);
        return false;
    }
  });
  
  const [timeDirection, setTimeDirection] = useState<'future' | 'past'>(() => {
    try {
        const saved = localStorage.getItem('timeDirection');
        return (saved === 'future' || saved === 'past') ? saved : 'future';
    } catch (e) {
        console.error("Failed to parse timeDirection from localStorage", e);
        return 'future';
    }
  });
  
  const [timeYears, setTimeYears] = useState<number>(() => {
    try {
        const saved = localStorage.getItem('timeYears');
        const years = saved ? parseInt(saved, 10) : 25;
        return isNaN(years) || years < 1 ? 25 : years;
    } catch (e) {
        console.error("Failed to parse timeYears from localStorage", e);
        return 25;
    }
  });

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioValue, setSelectedScenarioValue] = useState<string>('');
  
  useEffect(() => {
    // This effect initializes scenarios from localStorage or defaults.
    // It runs when the language or the prefill setting changes, but only
    // updates the default scenarios if the user hasn't saved their own.
    const savedScenarios = localStorage.getItem('futureScenarios');
    if (savedScenarios) {
      try {
        setScenarios(JSON.parse(savedScenarios));
        return; // Exit if user has custom scenarios
      } catch (e) {
        console.error("Failed to parse scenarios from localStorage", e);
        // If parsing fails, proceed to load defaults
      }
    }
    
    // No saved scenarios, so load defaults based on current language and settings.
    const defaultScenarios = t('scenarios', { returnObjects: true }) as Scenario[];
    if (prefillDescriptions) {
      const scenarioDefaults = t('scenarioDefaults', { returnObjects: true }) as Record<string, { description: string }>;
      const populatedScenarios = defaultScenarios.map(sc => {
        if (scenarioDefaults[sc.value] && scenarioDefaults[sc.value].description) {
          return { ...sc, description: scenarioDefaults[sc.value].description };
        }
        return sc;
      });
      setScenarios(populatedScenarios);
    } else {
      setScenarios(defaultScenarios);
    }
  }, [i18n.language, t, prefillDescriptions]);

  useEffect(() => {
    // Ensure selectedScenarioValue is valid if scenarios change
    if (scenarios.length > 0 && !scenarios.find(s => s.value === selectedScenarioValue)) {
      setSelectedScenarioValue(scenarios[0].value);
    }
  }, [scenarios, selectedScenarioValue]);

  // Save history to localStorage whenever relevant state changes, with debouncing
  useEffect(() => {
    const debounceSave = setTimeout(() => {
      if (currentImageId && originalImageUrl) {
        const saveData = async () => {
          // This function recursively tries to save, pruning history if it exceeds the quota.
          const trySave = async (
            history: HistoryEntry[],
            snapshots: Record<string, string[]>,
            currentGenerated: string[] | null
          ) => {
            try {
              // Compress all image data before attempting to save.
              const compressedOriginal = await compressImage(originalImageUrl);
              const compressedGenerated = currentGenerated
                ? await Promise.all(currentGenerated.map(url => compressImage(url)))
                : null;
              
              const compressedSnapshots: Record<string, string[]> = {};
              for (const key in snapshots) {
                if (Object.prototype.hasOwnProperty.call(snapshots, key)) {
                  compressedSnapshots[key] = await Promise.all(
                    snapshots[key].map(url => compressImage(url))
                  );
                }
              }

              const stateToSave = {
                originalImageUrl: compressedOriginal,
                generatedImageUrls: compressedGenerated,
                selectedGeneratedImageIndex,
                selectedScenarioValue,
                customPrompt,
                generationHistory: history,
                historySnapshots: compressedSnapshots,
              };

              localStorage.setItem(`history_${currentImageId}`, JSON.stringify(stateToSave));

              if (history.length < generationHistory.length) {
                setGenerationHistory(history);
                setHistorySnapshots(snapshots);
              }
            } catch (e) {
              if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') && history.length > 0) {
                console.warn("LocalStorage quota exceeded. Pruning oldest history entry and retrying.");
                const historyCopy = [...history];
                const snapshotsCopy = { ...snapshots };
                const oldestEntry = historyCopy.pop(); // Oldest is at the end

                if (oldestEntry) {
                  delete snapshotsCopy[oldestEntry.id];
                  // Retry recursively with the smaller (uncompressed) data. It will be compressed on the next try.
                  await trySave(historyCopy, snapshotsCopy, currentGenerated);
                }
              } else {
                console.error("Failed to save history to localStorage.", e);
              }
            }
          };

          // Kick off the save process with the current full-resolution state.
          trySave(generationHistory, historySnapshots, generatedImageUrls).catch(err => console.error("Error during background save process:", err));
        };

        saveData();
      }
    }, 1000); // 1-second debounce delay.

    return () => clearTimeout(debounceSave);
  }, [currentImageId, originalImageUrl, generatedImageUrls, selectedGeneratedImageIndex, selectedScenarioValue, customPrompt, generationHistory, historySnapshots]);


  const handleSaveScenarios = (updatedScenarios: Scenario[]) => {
    setScenarios(updatedScenarios);
    setPage('main');
  };

  const handleSaveSettings = (settings: { 
    numberOfGenerations: number; 
    isDevMode: boolean; 
    prefillDescriptions: boolean; 
    timeDirection: 'future' | 'past';
    timeYears: number;
  }) => {
    setNumberOfGenerations(settings.numberOfGenerations);
    localStorage.setItem('numberOfGenerations', String(settings.numberOfGenerations));
    setIsDevMode(settings.isDevMode);
    localStorage.setItem('isDevMode', JSON.stringify(settings.isDevMode));
    setPrefillDescriptions(settings.prefillDescriptions);
    localStorage.setItem('prefillDescriptions', JSON.stringify(settings.prefillDescriptions));
    setTimeDirection(settings.timeDirection);
    localStorage.setItem('timeDirection', settings.timeDirection);
    setTimeYears(settings.timeYears);
    localStorage.setItem('timeYears', String(settings.timeYears));
    setPage('main');
  };
  
  const handlePrefillDescriptionChange = (value: boolean) => {
    const savedScenariosJSON = localStorage.getItem('futureScenarios');
    if (savedScenariosJSON) {
        try {
            const savedScenarios = JSON.parse(savedScenariosJSON);
            const defaultScenarios = t('scenarios', { returnObjects: true }) as Scenario[];
            // Heuristic: If the number of saved scenarios is the same as the default,
            // we assume the user hasn't added/removed any and it's safe to reset them.
            if (savedScenarios.length === defaultScenarios.length) {
                localStorage.removeItem('futureScenarios');
            }
        } catch (e) {
            console.error("Could not process scenarios while changing prefill setting:", e);
        }
    }
    setPrefillDescriptions(value);
  };

  const handleImageUpload = useCallback((file: File) => {
    const imageId = `${file.name}-${file.size}-${file.lastModified}`;
    setCurrentImageId(imageId);

    const savedStateJSON = localStorage.getItem(`history_${imageId}`);
    
    const loadNewImage = (imageFile: File) => {
      setOriginalImage(imageFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImageUrl(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
      setGeneratedImageUrls(null);
      setSelectedGeneratedImageIndex(0);
      setCustomPromptState('');
      setPromptHistory(['']);
      setPromptHistoryIndex(0);
      setSelectedScenarioValue(scenarios[0]?.value || '');
      setGenerationHistory([]);
      setHistorySnapshots({});
    };

    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            setOriginalImage(file);
            setOriginalImageUrl(savedState.originalImageUrl);
            setGeneratedImageUrls(savedState.generatedImageUrls);
            setSelectedGeneratedImageIndex(savedState.selectedGeneratedImageIndex);
            setSelectedScenarioValue(savedState.selectedScenarioValue);
            const loadedPrompt = savedState.customPrompt || '';
            setCustomPromptState(loadedPrompt);
            setPromptHistory([loadedPrompt]);
            setPromptHistoryIndex(0);
            setGenerationHistory(savedState.generationHistory || []);
            setHistorySnapshots(savedState.historySnapshots || {});
        } catch (e) {
            console.error("Failed to parse saved history, loading as new image.", e);
            loadNewImage(file);
        }
    } else {
        loadNewImage(file);
    }
    
    // Reset undo/redo on any new image load
    setUndoImageUrl(null);
    setUndoIndex(null);
    setRedoImageUrl(null);
    setRedoIndex(null);
  }, [scenarios]);

  const renderPage = () => {
    switch(page) {
      case 'form':
        return (
            <ScenarioForm
              onSave={handleSaveScenarios}
              onCancel={() => setPage('main')}
              prefillDescriptions={prefillDescriptions}
            />
        );
      case 'settings':
        return (
            <SettingsPage
                initialNumberOfGenerations={numberOfGenerations}
                initialIsDevMode={isDevMode}
                initialPrefillDescriptions={prefillDescriptions}
                initialTimeDirection={timeDirection}
                initialTimeYears={timeYears}
                onSave={handleSaveSettings}
                onCancel={() => setPage('main')}
                onPrefillDescriptionsChange={handlePrefillDescriptionChange}
            />
        );
      case 'main':
      default:
        return (
            <ImageGenerator
              scenarios={scenarios}
              onManageScenarios={() => setPage('form')}
              onSettingsClick={() => setPage('settings')}
              customPrompt={customPrompt}
              onCustomPromptChange={onCustomPromptChange}
              numberOfGenerations={numberOfGenerations}
              isDevMode={isDevMode}
              timeDirection={timeDirection}
              timeYears={timeYears}
              // Pass down lifted state and handlers
              originalImage={originalImage}
              originalImageUrl={originalImageUrl}
              generatedImageUrls={generatedImageUrls}
              selectedGeneratedImageIndex={selectedGeneratedImageIndex}
              selectedScenarioValue={selectedScenarioValue}
              onImageUpload={handleImageUpload}
              onGeneratedImageUrlsChange={setGeneratedImageUrls}
              onSelectedGeneratedImageIndexChange={setSelectedGeneratedImageIndex}
              onSelectedScenarioValueChange={setSelectedScenarioValue}
              // Pass down image undo/redo state and handlers
              undoImageUrl={undoImageUrl}
              undoIndex={undoIndex}
              redoImageUrl={redoImageUrl}
              redoIndex={redoIndex}
              onUndoImageUrlChange={setUndoImageUrl}
              onUndoIndexChange={setUndoIndex}
              onRedoImageUrlChange={setRedoImageUrl}
              onRedoIndexChange={setRedoIndex}
              // History state
              generationHistory={generationHistory}
              onGenerationHistoryChange={setGenerationHistory}
              historySnapshots={historySnapshots}
              onHistorySnapshotsChange={setHistorySnapshots}
              // Prompt undo/redo
              onUndoPrompt={handleUndoPrompt}
              onRedoPrompt={handleRedoPrompt}
              canUndoPrompt={canUndoPrompt}
              canRedoPrompt={canRedoPrompt}
            />
        );
    }
  }

  return <>{renderPage()}</>;
};
