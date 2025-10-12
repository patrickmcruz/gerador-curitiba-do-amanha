import React, { useState, useEffect, useRef } from 'react';
import { UploadIcon, FullScreenIcon, CloseIcon, PencilIcon, GearIcon } from '../../../components/ui/Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
  className?: string;
  onSettingsClick: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageUrl, className, onSettingsClick }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        onImageUpload(event.dataTransfer.files[0]);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  const toggleFullScreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullScreen(false);
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
  }, [isFullScreen]);

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      <div className="flex justify-between items-center border-b border-gray-700 mb-2">
        <h2 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-blue border-b-2 border-brand-blue rounded-t-lg -mb-px">
            1. Suba a imagem
        </h2>
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg text-gray-400 border-transparent hover:text-white"
          aria-label="Abrir configurações"
          title="Configurações"
        >
          <GearIcon />
          <span>Configurações</span>
        </button>
      </div>
      <div
        onClick={imageUrl ? () => toggleFullScreen() : handleAreaClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative group flex flex-col items-center justify-center w-full flex-grow border-2 border-dashed border-gray-600 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors overflow-hidden"
        style={{ cursor: imageUrl ? 'zoom-in' : 'pointer' }}
      >
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="Uploaded preview" className="object-cover w-full h-full rounded-lg" />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAreaClick();
                }}
                className="bg-gray-800 bg-opacity-60 hover:bg-opacity-80 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                aria-label="Change image"
                title="Change image"
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                onClick={toggleFullScreen}
                className="bg-gray-800 bg-opacity-60 hover:bg-opacity-80 text-white font-bold p-3 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                aria-label="View image fullscreen"
              >
                <FullScreenIcon />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
            <UploadIcon />
            <p className="mb-2 text-sm"><span className="font-semibold">Clique para upload</span> ou arraste pra cá</p>
            <p className="text-xs">PNG, JPG ou WEBP</p>
          </div>
        )}
      </div>

      <input ref={fileInputRef} id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />

      {isFullScreen && imageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
          onClick={() => toggleFullScreen()}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen image view"
        >
            <button
              onClick={() => toggleFullScreen()}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10"
              aria-label="Close fullscreen"
            >
              <CloseIcon />
            </button>
            <img 
              src={imageUrl} 
              alt="Uploaded image fullscreen" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}
    </div>
  );
};