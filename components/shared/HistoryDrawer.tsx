
import React from 'react';
import { HistoryItem } from '../../types';
import Button from '../ui/Button';

interface HistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onReuse: (item: HistoryItem) => void;
    onDelete: (id: number) => void;
    onClear: () => void;
}

/**
 * A slide-in drawer component that displays the user's image generation history.
 * It allows users to view, reuse, and delete past generations.
 * @param {HistoryDrawerProps} props - The component props.
 * @returns {JSX.Element | null} The history drawer, or null if it's not open.
 */
const HistoryDrawer = ({ isOpen, onClose, history, onReuse, onDelete, onClear }: HistoryDrawerProps) => {
    if (!isOpen) return null;

    const typeLabels: Record<HistoryItem['type'], string> = {
        template: 'Template',
        final: 'Final Image',
        direct: 'Direct Gen',
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/80 flex justify-end" 
            role="dialog" 
            aria-modal="true"
            onClick={onClose}
        >
            <aside 
                className="w-full max-w-md h-full bg-card text-card-foreground flex flex-col shadow-2xl animate-slide-in-right"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Generation History</h2>
                    <Button variant="secondary" onClick={onClose} className="h-8 w-8 p-0 text-xl leading-none" aria-label="Close history">&times;</Button>
                </header>
                
                {history.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-muted-foreground">No history yet.</p>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {history.map(item => (
                            <div key={item.id} className="bg-muted/50 rounded-lg p-3 flex gap-4">
                                <img src={item.image} alt="Generated image" className="w-20 h-20 object-cover rounded-md bg-muted flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full">{typeLabels[item.type]}</span>
                                            <span className="text-xs font-semibold uppercase bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full">{item.aspectRatio}</span>
                                        </div>
                                        <button onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive text-xl leading-none flex-shrink-0 ml-2" aria-label={`Delete history item for prompt: ${item.prompt}`}>&times;</button>
                                    </div>
                                    <p className="text-sm truncate mt-1" title={item.prompt}>{item.prompt}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                                    <div className="mt-2">
                                        <Button onClick={() => onReuse(item)} className="h-7 px-2 text-xs w-full">Reuse</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <footer className="p-4 border-t border-border">
                    <Button variant="secondary" onClick={onClear} disabled={history.length === 0} className="w-full">Clear History</Button>
                </footer>
            </aside>
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default HistoryDrawer;
