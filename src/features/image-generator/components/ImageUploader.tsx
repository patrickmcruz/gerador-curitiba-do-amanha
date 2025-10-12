
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { UploadIcon, FullScreenIcon, CloseIcon, PencilIcon, GearIcon } from '../../../components/ui/Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
  className?: string;
  onSettingsClick: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageUrl, className, onSettingsClick }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const closeFullScreen = useCallback(() => {
    setIsFullScreen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFullScreen();
      }
    };
    if (isFullScreen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen, closeFullScreen]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
        <div className="flex justify-between items-center border-b border-gray-700">
            <h2 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-blue border-b-2 border-brand-blue rounded-t-lg -mb-px">
                {t('imageUploader.title', '1. Suba uma imagem')}
            </h2>
            <button
                onClick={onSettingsClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg text-gray-400 border-transparent hover:text-white"
                aria-label={t('settings.title', 'Configurações')}
                title={t('settings.title', 'Configurações')}
            >
                <GearIcon />
                <span>{t('settings.title', 'Configurações')}</span>
            </button>
        </div>
      <div
        className={`relative group w-full flex-grow border-2 border-dashed rounded-lg transition-colors p-4 flex items-center justify-center text-center cursor-pointer
          ${isDragging ? 'border-brand-blue bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}
          ${imageUrl ? 'border-solid' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!imageUrl ? handleClick : undefined}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {imageUrl ? (
          <>
            <img src={imageUrl} alt={t('imageUploader.uploadedImageAlt', 'Imagem enviada')} className="object-contain w-full h-full max-h-[400px] rounded-md" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
              <button
                onClick={handleClick}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg backdrop-blur-sm"
              >
                <PencilIcon />
                {t('imageUploader.changeImage', 'Trocar Imagem')}
              </button>
              <button
                onClick={() => setIsFullScreen(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg backdrop-blur-sm"
              >
                <FullScreenIcon />
                {t('imageDisplay.fullscreen', 'Tela Cheia')}
              </button>
            </div>
          </>
        ) : (
          <div className="text-gray-400">
            <UploadIcon />
            <p className="font-semibold"><Trans i18nKey="imageUploader.dragAndDrop" defaults='<0>Clique para enviar</0> ou arraste'><span className="text-brand-blue">Clique para enviar</span> ou arraste</Trans></p>
            <p className="text-sm text-gray-500">{t('imageUploader.fileTypes', 'PNG, JPG, WEBP')}</p>
          </div>
        )}
      </div>
      {isFullScreen && imageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
          onClick={closeFullScreen}
          role="dialog"
          aria-modal="true"
          aria-label={t('imageUploader.fullscreenTitle', 'Visualização da imagem original')}
        >
          <button
            onClick={closeFullScreen}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            aria-label={t('imageDisplay.close', 'Fechar')}
          >
            <CloseIcon />
          </button>
          <img src={imageUrl} alt={t('imageUploader.uploadedImageAlt', 'Imagem enviada')} className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
};
