import React, { useState, useRef } from 'react';
import { HistoryEntry } from '../constants';
import { TrashIcon } from '../../../components/ui/Icons';

interface GenerationHistoryPanelProps {
  history: HistoryEntry[];
  snapshots: Record<string, string[]>;
  onRevert: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const timeAgo = (timestamp: number): string => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
  
    if (seconds < 5) return "agora";

    let interval = seconds / 31536000;
    if (interval > 1) {
      const years = Math.floor(interval);
      return `${years} ano${years > 1 ? 's' : ''} atrás`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      const months = Math.floor(interval);
      return `${months} ${months > 1 ? 'meses' : 'mês'} atrás`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        return `${days} dia${days > 1 ? 's' : ''} atrás`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    }
    return `${Math.floor(seconds)} segundos atrás`;
};

const getHistoryEntryTitle = (type: HistoryEntry['type']): string => {
    switch (type) {
        case 'initial':
            return 'Geração Inicial';
        case 'refinement':
            return 'Refinamento por Texto';
        case 'mask_edit':
            return 'Edição Mágica';
        default:
            return 'Geração';
    }
}

export const GenerationHistoryPanel: React.FC<GenerationHistoryPanelProps> = ({ history, snapshots, onRevert, onClear }) => {
    const [hoveredPreview, setHoveredPreview] = useState<{
        imageUrl: string;
        top: number;
        left: number;
      } | null>(null);
    
    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, entry: HistoryEntry) => {
        const imageUrl = snapshots[entry.id]?.[entry.selectedGeneratedImageIndex];
        if (!imageUrl) return;
    
        const targetRect = e.currentTarget.getBoundingClientRect();
        
        const PREVIEW_WIDTH = 320; // h-80, w-80 in tailwind
        const PREVIEW_HEIGHT = 320;
        const MARGIN = 16;
    
        let left = targetRect.right + MARGIN;
        
        // If it goes off-screen to the right, position it on the left
        if (left + PREVIEW_WIDTH > window.innerWidth - MARGIN) {
          left = targetRect.left - PREVIEW_WIDTH - MARGIN;
        }
    
        // Center it vertically relative to the hovered item
        let top = targetRect.top + (targetRect.height / 2) - (PREVIEW_HEIGHT / 2);
    
        // Clamp vertical position to stay within the viewport
        top = Math.max(MARGIN, Math.min(top, window.innerHeight - PREVIEW_HEIGHT - MARGIN));
    
        setHoveredPreview({ imageUrl, top, left });
    };

    const handleMouseLeave = () => {
        setHoveredPreview(null);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-300">Histórico de Gerações</h2>
                <button 
                    onClick={onClear} 
                    className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed p-2 rounded-full transition-colors"
                    title="Limpar Histórico"
                    disabled={history.length === 0}
                >
                    <TrashIcon />
                </button>
            </div>
            <div className="flex-grow bg-gray-700/50 rounded-lg border border-gray-700 overflow-hidden">
                {history.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center text-gray-500 p-4">
                        <p>O histórico de suas gerações aparecerá aqui.</p>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-3 space-y-3">
                        {history.map(entry => (
                            <div 
                                key={entry.id}
                                onMouseEnter={(e) => handleMouseEnter(e, entry)}
                                onMouseLeave={handleMouseLeave}
                                className="flex items-start gap-4 p-3 rounded-lg bg-gray-900/50 border border-gray-600/50 hover:bg-gray-800/70 transition-colors cursor-pointer"
                            >
                                <div className="flex-shrink-0">
                                    <img 
                                        src={entry.thumbnailUrl} 
                                        alt="History thumbnail"
                                        className="w-32 h-32 rounded-md object-cover bg-gray-700"
                                    />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs font-semibold text-brand-blue">{getHistoryEntryTitle(entry.type)}</p>
                                    <p className="text-sm text-gray-300 truncate" title={entry.prompt}>
                                        "{entry.prompt}"
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{timeAgo(entry.timestamp)}</p>
                                    <button
                                        onClick={() => onRevert(entry)}
                                        className="mt-2 px-3 py-1 text-xs font-bold text-white bg-brand-purple hover:bg-brand-purple/80 rounded-md transition-colors"
                                    >
                                        Restaurar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {hoveredPreview && (
                <div
                    className="fixed z-50 pointer-events-none animate-fade-in"
                    style={{
                    top: `${hoveredPreview.top}px`,
                    left: `${hoveredPreview.left}px`,
                    }}
                >
                    <img
                        src={hoveredPreview.imageUrl}
                        alt="History preview"
                        className="h-80 w-80 rounded-lg object-contain bg-gray-900/50 shadow-2xl border-2 border-gray-600 backdrop-blur-sm"
                    />
                </div>
            )}
        </div>
    );
};