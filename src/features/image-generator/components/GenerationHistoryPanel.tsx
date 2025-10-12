import React from 'react';
import { HistoryEntry } from '../constants';
import { TrashIcon } from '../../../components/ui/Icons';

interface GenerationHistoryPanelProps {
  history: HistoryEntry[];
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

export const GenerationHistoryPanel: React.FC<GenerationHistoryPanelProps> = ({ history, onRevert, onClear }) => {
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
                        <div key={entry.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-900/50 border border-gray-600/50 hover:bg-gray-800/70 transition-colors">
                            <img 
                                src={entry.thumbnailUrl} 
                                alt="History thumbnail"
                                className="w-20 h-20 rounded-md object-cover flex-shrink-0 bg-gray-700"
                            />
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
    </div>
  );
};