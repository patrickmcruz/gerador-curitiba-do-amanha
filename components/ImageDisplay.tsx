import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { FullScreenIcon } from './icons/FullScreenIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CompareIcon } from './icons/CompareIcon';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ImageDisplayProps {
  title: string;
  subtitle?: string;
  imageUrls: string[] | null;
  originalImageUrl: string | null;
  isLoading?: boolean;
  className?: string;
  onModifyClick?: () => void;
  selectedImageIndex: number;
  onSelectImageIndex: (index: number) => void;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, subtitle, imageUrls, originalImageUrl, isLoading, className, onModifyClick, selectedImageIndex, onSelectImageIndex }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  const selectedImageUrl = imageUrls ? imageUrls[selectedImageIndex] : null;

  const closeFullScreen = () => {
    setIsFullScreen(false);
    setIsComparing(false); // Reset comparison mode on close
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imageUrls && imageUrls.length > 1) {
      onSelectImageIndex((selectedImageIndex - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (imageUrls && imageUrls.length > 1) {
      onSelectImageIndex((selectedImageIndex + 1) % imageUrls.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFullScreen();
      }
      if (imageUrls && imageUrls.length > 1) {
        if (event.key === 'ArrowLeft') {
          handlePrevImage();
        } else if (event.key === 'ArrowRight') {
          handleNextImage();
        }
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
  }, [isFullScreen, imageUrls, selectedImageIndex, onSelectImageIndex]);

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
    <div className={`w-full flex flex-col h-full ${className || ''}`}>
      <h2 className="text-lg font-semibold mb-2 text-gray-300">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 -mt-2 mb-2">{subtitle}</p>}
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
              alt={title} 
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
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
          onClick={closeFullScreen}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image view"
        >
          {/* Top Right Controls */}
          <button
            onClick={closeFullScreen}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-20"
            aria-label="Close fullscreen"
          >
            <CloseIcon />
          </button>
          
          {/* Navigation Controls */}
          {imageUrls && imageUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-20"
                aria-label="Previous image"
              >
                <ChevronLeftIcon />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-20"
                aria-label="Next image"
              >
                <ChevronRightIcon />
              </button>
            </>
          )}

          {/* Bottom Right Controls */}
          {originalImageUrl && (
            <div className="absolute bottom-4 right-4 z-20">
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
          
          {/* Main Content */}
          <div className="w-full h-full flex items-center justify-center p-8 sm:p-16" onClick={(e) => e.stopPropagation()}>
            {isComparing && originalImageUrl ? (
              <ImageComparisonSlider beforeImageUrl={originalImageUrl} afterImageUrl={selectedImageUrl} />
            ) : (
              <img 
                src={selectedImageUrl} 
                alt={title} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
