import React, { useState, useEffect, useCallback } from 'react';
import { ImageGenerator } from '../features/image-generator/components/ImageGenerator';
import { Scenario, SCENARIOS, HistoryEntry } from '../features/image-generator/constants';
import { ScenarioForm } from '../features/image-generator/components/ScenarioForm';

export const HomePage: React.FC = () => {
  const [page, setPage] = useState<'main' | 'form'>('main');
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


  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const savedScenarios = localStorage.getItem('futureScenarios');
      return savedScenarios ? JSON.parse(savedScenarios) : SCENARIOS;
    } catch (e) {
      console.error("Failed to parse scenarios from localStorage", e);
      return SCENARIOS;
    }
  });
  
  const [selectedScenarioValue, setSelectedScenarioValue] = useState<string>(scenarios[0]?.value || '');

  useEffect(() => {
    // Ensure selectedScenarioValue is valid if scenarios change
    if (!scenarios.find(s => s.value === selectedScenarioValue)) {
      setSelectedScenarioValue(scenarios[0]?.value || '');
    }
  }, [scenarios, selectedScenarioValue]);

  // Save history to localStorage whenever relevant state changes
  useEffect(() => {
    if (currentImageId && originalImageUrl) {
        const trySave = (history: HistoryEntry[], snapshots: Record<string, string[]>) => {
            const stateToSave = {
                originalImageUrl,
                generatedImageUrls,
                selectedGeneratedImageIndex,
                selectedScenarioValue,
                customPrompt,
                generationHistory: history,
                historySnapshots: snapshots,
            };
            try {
                localStorage.setItem(`history_${currentImageId}`, JSON.stringify(stateToSave));
                // If the save was successful but the state was pruned during the process,
                // we update the React state to match what was actually saved.
                if (history.length < generationHistory.length) {
                    setGenerationHistory(history);
                    setHistorySnapshots(snapshots);
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === 'QuotaExceededError' && history.length > 0) {
                    console.warn("LocalStorage quota exceeded. Pruning oldest history entry and retrying.");
                    const historyCopy = [...history];
                    const snapshotsCopy = { ...snapshots };
                    // Prune the oldest entry (which is at the end of the array)
                    const oldestEntry = historyCopy.pop();

                    if (oldestEntry) {
                      delete snapshotsCopy[oldestEntry.id];
                      trySave(historyCopy, snapshotsCopy); // Retry recursively with the smaller data
                    }
                } else {
                    console.error("Failed to save history to localStorage.", e);
                }
            }
        };
        trySave(generationHistory, historySnapshots);
    }
  }, [currentImageId, originalImageUrl, generatedImageUrls, selectedGeneratedImageIndex, selectedScenarioValue, customPrompt, generationHistory, historySnapshots]);


  const handleSaveScenarios = (updatedScenarios: Scenario[]) => {
    setScenarios(updatedScenarios);
    localStorage.setItem('futureScenarios', JSON.stringify(updatedScenarios));
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

  return (
    <>
      {page === 'main' ? (
        <ImageGenerator
          scenarios={scenarios}
          onManageScenarios={() => setPage('form')}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
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