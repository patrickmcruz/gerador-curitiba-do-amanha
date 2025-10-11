import React, { useState, useEffect } from 'react';
import { ImageGenerator } from '../features/image-generator/components/ImageGenerator';
import { Scenario, SCENARIOS } from '../features/image-generator/constants';
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


  const handleSaveScenarios = (updatedScenarios: Scenario[]) => {
    setScenarios(updatedScenarios);
    localStorage.setItem('futureScenarios', JSON.stringify(updatedScenarios));
    setPage('main');
  };

  const handleImageUpload = (file: File) => {
    setOriginalImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setGeneratedImageUrls(null);
    setSelectedGeneratedImageIndex(0);
    // Reset undo/redo state on new image upload
    setUndoImageUrl(null);
    setUndoIndex(null);
    setRedoImageUrl(null);
    setRedoIndex(null);
  };

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