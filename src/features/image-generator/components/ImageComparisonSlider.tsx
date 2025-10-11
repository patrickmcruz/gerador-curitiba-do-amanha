import React, { useState, useRef, useCallback } from 'react';

interface ImageComparisonSliderProps {
  beforeImageUrl: string;
  afterImageUrl: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ beforeImageUrl, afterImageUrl }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let percentage = (x / rect.width) * 100;
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      setSliderPosition(percentage);
    }
  }, []);

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    // For touch, we need to prevent default to avoid scrolling
    if (e.nativeEvent instanceof TouchEvent) {
      e.preventDefault();
    }
  }, []);

  const onDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    const clientX = 'touches' in e.nativeEvent ? e.nativeEvent.touches[0].clientX : e.nativeEvent.clientX;
    handleMove(clientX);
  }, [handleMove]);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
  }, []);
  
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full max-w-full max-h-full select-none cursor-ew-resize overflow-hidden rounded-lg shadow-2xl"
      onMouseDown={startDrag}
      onMouseUp={stopDrag}
      onMouseMove={onDrag}
      onMouseLeave={stopDrag} // Stop dragging if mouse leaves the container
      onTouchStart={startDrag}
      onTouchEnd={stopDrag}
      onTouchMove={onDrag}
    >
      {/* Generated Image (Right side - Base layer) */}
      <img
        src={afterImageUrl}
        alt="Generated"
        className="block w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none">
        Gerado
      </div>

      {/* Original Image (Left side - Top layer, clipped) */}
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImageUrl}
          alt="Original"
          className="block w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none">
          Original
        </div>
      </div>
      
      {/* Slider Divider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-lg pointer-events-none"
        style={{ left: `calc(${sliderPosition}% - 1px)` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l-6 6 6 6m6-12l6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
};
