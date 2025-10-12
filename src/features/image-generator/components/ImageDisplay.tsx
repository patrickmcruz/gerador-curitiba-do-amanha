import React, { useState, useEffect, useCallback } from 'react';
import { SpinnerIcon, DownloadIcon, FullScreenIcon, CloseIcon, SparklesIcon, CompareIcon, ChevronLeftIcon, ChevronRightIcon, UndoIcon, RedoIcon, BrushIcon } from '../../../components/ui/Icons';
import { ImageComparisonSlider } from './ImageComparisonSlider';

interface ImageDisplayProps {
  subtitle?: string;
  imageUrls: string[] | null;
  originalImageUrl: string | null;
  isLoading?: boolean;
  onModifyClick?: () => void;
  selectedImageIndex: number;
  onSelectImageIndex: (index: number) => void;
  isUndoAvailable?: boolean;
  onUndoClick?: () => void;
  isRedoAvailable?: boolean;
  onRedoClick?: () => void;
  // Fullscreen refinement props
  isRefiningInFullScreen: boolean;
  onIsRefiningInFullScreenChange: (value: boolean) => void;
  modificationPrompt: string;
  onModificationPromptChange: (prompt: string) => void;
  onModificationGenerateClick: () => void;
  onOpenMaskEditor: (imageUrl: string) => void;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  subtitle, 
  imageUrls, 
  originalImageUrl, 
  isLoading, 
  onModifyClick, 
  selectedImageIndex, 
  onSelectImageIndex, 
  isUndoAvailable, 
  onUndoClick, 
  isRedoAvailable, 
  onRedoClick,
  isRefiningInFullScreen,
  onIsRefiningInFullScreenChange,
  modificationPrompt,
  onModificationPromptChange,
  onModificationGenerateClick,
  onOpenMaskEditor,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  const selectedImageUrl = imageUrls ? imageUrls[selectedImageIndex] : null;

  const closeFullScreen = useCallback(() => {
    setIsFullScreen(false);
    setIsComparing(false); // Reset comparison mode on close
    onIsRefiningInFullScreenChange(false); // Reset refinement mode on close
  }, [onIsRefiningInFullScreenChange]);

  const handlePrevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imageUrls && imageUrls.length > 1) {
      onSelectImageIndex((selectedImageIndex - 1 + imageUrls.length) % imageUrls.length);
    }
  }, [imageUrls, selectedImageIndex, onSelectImageIndex]);

  const handleNextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imageUrls && imageUrls.length > 1) {
      onSelectImageIndex((selectedImageIndex + 1) % imageUrls.length);
    }
  }, [imageUrls, selectedImageIndex, onSelectImageIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFullScreen();
      }
      if (event.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (event.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isFullScreen, handlePrevImage, handleNextImage, closeFullScreen]);

  const handleDownload = () => {
    if (!selectedImageUrl) return;
    const link = document.createElement('a');
    link.href = selectedImageUrl;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canBeMaximized = selectedImageUrl && !isLoading;

  return (
    <div className="w-full flex flex-col h-full">
      {subtitle && <p className="text-sm text-gray-400 mb-2">{subtitle}</p>}
      <div
        className="relative group w-full flex-grow bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex flex-col items-center text-gray-400">
            <SpinnerIcon />
            <p className="mt-2">Gerando imagem da cidade...</p>
          </div>
        ) : selectedImageUrl ? (
          <>
            <img 
              src={selectedImageUrl} 
              alt="Resultado Gerado" 
              className="object-cover w-full h-full"
              onClick={() => canBeMaximized && setIsFullScreen(true)}
              style={{ cursor: canBeMaximized ? 'zoom-in' : 'default' }}
            />

            {/* Gallery Thumbnails */}
            {imageUrls && imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 p-2 rounded-lg backdrop-blur-sm shadow-lg">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); onSelectImageIndex(index); }}
                    className={`w-14 h-14 rounded-md overflow-hidden border-2 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue ${selectedImageIndex === index ? 'border-brand-blue' : 'border-gray-500/50 hover:border-white'}`}
                    aria-label={`Select variation ${index + 1}`}
                    title={`Variation ${index + 1}`}
                  >
                    <img src={url} alt={`Variation ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {isUndoAvailable && onUndoClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUndoClick(); }}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  aria-label="Undo modification"
                  title="Desfazer"
                >
                  <UndoIcon />
                </button>
              )}
              {isRedoAvailable && onRedoClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRedoClick(); }}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  aria-label="Redo modification"
                  title="Refazer"
                >
                  <RedoIcon />
                </button>
              )}
              {onModifyClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onModifyClick(); }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  aria-label="Refine image"
                  title="Refinar imagem"
                >
                  <SparklesIcon />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setIsFullScreen(true); }}
                className="bg-gray-800 bg-opacity-60 hover:bg-opacity-80 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                aria-label="View image fullscreen"
                title="Tela cheia"
              >
                <FullScreenIcon />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue"
                aria-label="Download generated image"
                title="Download"
              >
                <DownloadIcon />
              </button>
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-center p-4">
            <p>Sua imagem gerada aparecerá aqui</p>
          </div>
        )}
      </div>

      {isFullScreen && selectedImageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-start p-4 animate-fade-in backdrop-blur-sm"
          onClick={closeFullScreen}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image view"
        >
          {/* Top Right Controls */}
          <button
            onClick={closeFullScreen}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-30"
            aria-label="Close fullscreen"
          >
            <CloseIcon />
          </button>
          
          {isRefiningInFullScreen && (
            <div className="w-full max-w-3xl mx-auto p-4 bg-gray-900/70 rounded-lg animate-fade-in my-4 flex-shrink-0 z-20" onClick={(e) => e.stopPropagation()}>
                <div className="animate-fade-in flex flex-col gap-3">
                  <h2 className="text-lg font-semibold text-gray-200 text-center">4. Refine o Resultado</h2>
                  <button
                    onClick={() => onOpenMaskEditor(selectedImageUrl!)}
                    disabled={isLoading || !selectedImageUrl}
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
                    onChange={(e) => onModificationPromptChange(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                    placeholder="Ex: adicione mais pessoas, remova árvores..."
                  />
                  <button
                    onClick={onModificationGenerateClick}
                    disabled={!modificationPrompt || isLoading || !selectedImageUrl}
                    className="w-full flex justify-center items-center gap-2 bg-brand-purple hover:bg-brand-purple/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-brand-purple/20"
                  >
                    {isLoading ? ( <> <SpinnerIcon /> Refinando... </> ) : ( 'Gerar Variação (Texto)' )}
                  </button>
                </div>
            </div>
          )}

          {/* Main Content */}
          <div className="relative w-full h-full flex-grow flex items-center justify-center min-h-0" onClick={(e) => e.stopPropagation()}>
            {isComparing && originalImageUrl ? (
              <ImageComparisonSlider beforeImageUrl={originalImageUrl} afterImageUrl={selectedImageUrl} />
            ) : (
              <img 
                src={selectedImageUrl} 
                alt="Resultado gerado em tela cheia" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
            
            {/* Navigation Controls */}
            {imageUrls && imageUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-colors z-20"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-colors z-20"
                  aria-label="Next image"
                >
                  <ChevronRightIcon />
                </button>
              </>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 z-20 flex items-center gap-2 p-4">
              {isUndoAvailable && onUndoClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUndoClick(); }}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  aria-label="Undo modification"
                  title="Desfazer"
                >
                  <UndoIcon />
                </button>
              )}
              {isRedoAvailable && onRedoClick && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRedoClick(); }}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  aria-label="Redo modification"
                  title="Refazer"
                >
                  <RedoIcon />
                </button>
              )}
              {onModifyClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onIsRefiningInFullScreenChange(!isRefiningInFullScreen);
                  }}
                  className={`font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${isRefiningInFullScreen ? 'bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                  aria-label="Refine image"
                  title="Refinar imagem"
                >
                  <SparklesIcon />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue"
                aria-label="Download generated image"
                title="Download"
              >
                <DownloadIcon />
              </button>
            </div>
            {originalImageUrl && (
              <div className="absolute bottom-0 right-0 z-20 p-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsComparing(p => !p); }}
                  className={`font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${isComparing ? 'bg-brand-blue text-white' : 'bg-gray-800 bg-opacity-60 hover:bg-opacity-80 text-white'}`}
                  aria-label="Compare with original"
                  title="Compare with original"
                >
                  <CompareIcon />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
