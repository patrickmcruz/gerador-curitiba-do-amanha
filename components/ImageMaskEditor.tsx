import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { BrushIcon } from './icons/BrushIcon';
import { UndoIcon } from './icons/UndoIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ImageMaskEditorProps {
  imageUrl: string;
  onClose: () => void;
  onGenerate: (mask: string, prompt: string) => void;
  isLoading: boolean;
}

export const ImageMaskEditor: React.FC<ImageMaskEditorProps> = ({ imageUrl, onClose, onGenerate, isLoading }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null); // For custom cursor
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(40);
  const [history, setHistory] = useState<ImageData[]>([]);
  
  // State for custom cursor
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [displayBrushSize, setDisplayBrushSize] = useState(brushSize);

  const getCanvasContext = useCallback(() => canvasRef.current?.getContext('2d'), []);

  const updateDisplayBrushSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) { // Avoid division by zero
        const scale = canvas.width / rect.width;
        // brushSize is in canvas pixels, so we divide by scale to get screen pixels.
        setDisplayBrushSize(brushSize / scale);
      }
    }
  }, [brushSize]);
  
  useEffect(() => {
    updateDisplayBrushSize();
    window.addEventListener('resize', updateDisplayBrushSize);
    return () => {
      window.removeEventListener('resize', updateDisplayBrushSize);
    };
  }, [updateDisplayBrushSize]);

  // Initialize canvas when image loads
  const handleImageLoad = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (image && canvas && ctx) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      setTimeout(updateDisplayBrushSize, 0); // Update brush display size after layout
    }
  };

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientX : e.nativeEvent.clientX;
    const clientY = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientY : e.nativeEvent.clientY;
    
    // Calculate scale factor
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const saveToHistory = useCallback(() => {
    const ctx = getCanvasContext();
    if(ctx && canvasRef.current) {
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHistory(prev => [...prev, imageData]);
    }
  }, [getCanvasContext]);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPointerPos(e);
    if (pos) {
      isDrawing.current = true;
      lastPos.current = pos;
      saveToHistory(); // Save state before drawing starts
    }
  }, [getPointerPos, saveToHistory]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    const ctx = getCanvasContext();

    if (pos && ctx && lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPos.current = pos;
    }
  }, [brushSize, getCanvasContext, getPointerPos]);

  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
  }, []);
  
  const handleUndo = useCallback(() => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if(ctx && canvas && history.length > 0) {
      const lastState = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      ctx.putImageData(lastState, 0, 0);
    }
  }, [getCanvasContext, history]);

  const handleClear = useCallback(() => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if(ctx && canvas) {
      saveToHistory();
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [getCanvasContext, saveToHistory]);
  
  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (canvas && prompt) {
      const maskDataUrl = canvas.toDataURL('image/png');
      onGenerate(maskDataUrl, prompt);
    }
  };
  
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    const container = editorContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setCursorPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    draw(e);
  };
  
  const handleContainerMouseLeave = () => {
    setCursorPosition(null);
    stopDrawing();
  };


  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 animate-fade-in backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Magic Edit with Mask"
    >
      {/* Top Controls */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-4 px-2">
        <h2 className="text-xl font-bold text-white">Edição Mágica</h2>
        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
          <CloseIcon />
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        ref={editorContainerRef}
        className="relative w-full h-full max-w-6xl max-h-[calc(100vh-200px)] flex items-center justify-center cursor-none"
        onMouseDown={startDrawing}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={handleContainerMouseLeave}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Image to edit"
          className="max-w-full max-h-full object-contain select-none"
          onLoad={handleImageLoad}
          crossOrigin="anonymous"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ objectFit: 'contain', mixBlendMode: 'screen', opacity: 0.5 }}
        />
        {cursorPosition && (
          <div 
            className="absolute rounded-full border border-white bg-white/25 pointer-events-none"
            style={{
              left: `${cursorPosition.x}px`,
              top: `${cursorPosition.y}px`,
              width: `${displayBrushSize}px`,
              height: `${displayBrushSize}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-6xl mt-4 p-4 bg-gray-800/50 rounded-lg flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <BrushIcon />
            <input 
              type="range" 
              min="5" 
              max="150" 
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-32 cursor-pointer"
              aria-label="Tamanho do Pincel"
            />
          </div>
          <button onClick={handleUndo} disabled={history.length === 0} className="p-2 text-white hover:bg-gray-700 rounded-full disabled:text-gray-500 disabled:cursor-not-allowed" title="Desfazer">
            <UndoIcon />
          </button>
          <button onClick={handleClear} className="p-2 text-white hover:bg-gray-700 rounded-full" title="Clear mask">
            <TrashIcon />
          </button>
        </div>
        <div className="flex-grow flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva o que você quer mudar na area marcada..."
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt || isLoading}
            className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? <><SpinnerIcon /> Gerando...</> : 'Gerar'}
          </button>
        </div>
      </div>
    </div>
  );
};