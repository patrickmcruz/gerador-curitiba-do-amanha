import React, { useState, useEffect, useCallback } from 'react';
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
  const [customPrompt, setCustomPrompt] = useState<string>('');

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


  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const savedScenarios = localStorage.getItem('futureScenarios');
    if (savedScenarios) {
        try {
            return JSON.parse(savedScenarios);
        } catch (e) {
            console.error("Failed to parse scenarios from localStorage", e);
        }
    }
    return t('scenarios', { returnObjects: true }) as Scenario[];
  });
  
  const [selectedScenarioValue, setSelectedScenarioValue] = useState<string>(scenarios[0]?.value || '');
  
  useEffect(() => {
    // This effect updates the default scenarios when the language changes,
    // but only if the user hasn't saved their own custom scenarios.
    const savedScenarios = localStorage.getItem('futureScenarios');
    if (!savedScenarios) {
      const newScenarios = t('scenarios', { returnObjects: true }) as Scenario[];
      setScenarios(newScenarios);
    }
  }, [i18n.language, t]);

  useEffect(() => {
    // Ensure selectedScenarioValue is valid if scenarios change
    if (!scenarios.find(s => s.value === selectedScenarioValue)) {
      setSelectedScenarioValue(scenarios[0]?.value || '');
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

  const handleSaveSettings = (settings: { numberOfGenerations: number; isDevMode: boolean }) => {
    setNumberOfGenerations(settings.numberOfGenerations);
    localStorage.setItem('numberOfGenerations', String(settings.numberOfGenerations));
    setIsDevMode(settings.isDevMode);
    localStorage.setItem('isDevMode', JSON.stringify(settings.isDevMode));
    setPage('main');
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
      setCustomPrompt('');
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
            setCustomPrompt(savedState.customPrompt || '');
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
            />
        );
      case 'settings':
        return (
            <SettingsPage
                initialNumberOfGenerations={numberOfGenerations}
                initialIsDevMode={isDevMode}
                onSave={handleSaveSettings}
                onCancel={() => setPage('main')}
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
              onCustomPromptChange={setCustomPrompt}
              numberOfGenerations={numberOfGenerations}
              isDevMode={isDevMode}
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
              // Pass down undo/redo state and handlers
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
            />
        );
    }
  }

  return <>{renderPage()}</>;
};
