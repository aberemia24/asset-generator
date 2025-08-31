
import React, { useState } from 'react';
import { AppMode, HistoryItem, AspectRatio } from './types';
import CompositionMode from './components/composition/CompositionMode';
import DirectGenerationMode from './components/direct/DirectGenerationMode';
import { ToggleGroup, ToggleButton } from './components/ui/ToggleGroup';
import useLocalStorage from './hooks/useLocalStorage';
import HistoryDrawer from './components/shared/HistoryDrawer';
import Button from './components/ui/Button';

/**
 * The root component of the Content Canvas application.
 * It manages the top-level state, including the current mode (composition vs. direct),
 * shared settings like negative prompts, and the generation history.
 */
const App = () => {
    const [mode, setMode] = useState<AppMode>('composition');
    
    // --- Centralized State ---
    // These state variables are passed down to the active mode component.
    const [templatePrompt, setTemplatePrompt] = useState('A professional photo scene. A minimalist office desk with a laptop and a coffee cup sits by a window with soft morning light.');
    const [subjectPrompt, setSubjectPrompt] = useState('Add a new smartphone displaying a colorful chart on the desk.');
    const [directPrompt, setDirectPrompt] = useState('A minimalist, flat vector logo of a brain made of circuits, vibrant blue and green gradient, on a clean white background.');
    const [negativePrompt, setNegativePrompt] = useState('blurry, deformed, ugly, text, watermark, signature');
    const [compAspectRatio, setCompAspectRatio] = useState<AspectRatio>('16:9');
    const [directAspectRatio, setDirectAspectRatio] = useState<AspectRatio>('1:1');
    const [batchSize, setBatchSize] = useState(1);

    // --- History Feature ---
    const [history, setHistory] = useLocalStorage<HistoryItem[]>('generationHistory', []);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    /**
     * Handles reusing a past generation from the history drawer.
     * It sets the mode and populates the relevant prompts and settings.
     * @param item The history item to reuse.
     */
    const handleReuseHistoryItem = (item: HistoryItem) => {
        setNegativePrompt(item.negativePrompt);
        switch (item.type) {
            case 'template':
                setMode('composition');
                setTemplatePrompt(item.prompt);
                setCompAspectRatio(item.aspectRatio);
                break;
            case 'final':
                setMode('composition');
                setSubjectPrompt(item.prompt);
                setCompAspectRatio(item.aspectRatio);
                break;
            case 'direct':
                setMode('direct');
                setDirectPrompt(item.prompt);
                setDirectAspectRatio(item.aspectRatio);
                break;
        }
        setIsHistoryOpen(false);
    };

    /**
     * Deletes a single item from the history.
     * @param id The ID of the history item to delete.
     */
    const handleDeleteHistoryItem = (id: number) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };
    
    /**
     * Clears the entire generation history.
     */
    const handleClearHistory = () => {
        setHistory([]);
    };


    return (
        <>
            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onReuse={handleReuseHistoryItem}
                onDelete={handleDeleteHistoryItem}
                onClear={handleClearHistory}
            />
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <header className="text-center mb-6 relative">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Content Canvas</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Your integrated AI content generation suite.</p>
                     <Button 
                        variant="secondary" 
                        className="absolute top-0 right-0"
                        onClick={() => setIsHistoryOpen(true)}
                        aria-label="Open generation history"
                    >
                        History
                    </Button>
                </header>

                <div className="flex justify-center mb-6">
                    <ToggleGroup>
                        <ToggleButton
                            state={mode === 'composition' ? 'active' : 'inactive'}
                            onClick={() => setMode('composition')}
                        >
                            Composition Mode
                        </ToggleButton>
                        <ToggleButton
                            state={mode === 'direct' ? 'active' : 'inactive'}
                            onClick={() => setMode('direct')}
                        >
                            Direct Generation
                        </ToggleButton>
                    </ToggleGroup>
                </div>

                <main>
                    {mode === 'composition' && (
                        <CompositionMode
                            templatePrompt={templatePrompt}
                            setTemplatePrompt={setTemplatePrompt}
                            subjectPrompt={subjectPrompt}
                            setSubjectPrompt={setSubjectPrompt}
                            negativePrompt={negativePrompt}
                            setNegativePrompt={setNegativePrompt}
                            aspectRatio={compAspectRatio}
                            setAspectRatio={setCompAspectRatio}
                            history={history}
                            setHistory={setHistory}
                        />
                    )}
                    {mode === 'direct' && (
                        <DirectGenerationMode
                            directPrompt={directPrompt}
                            setDirectPrompt={setDirectPrompt}
                            negativePrompt={negativePrompt}
                            setNegativePrompt={setNegativePrompt}
                            aspectRatio={directAspectRatio}
                            setAspectRatio={setDirectAspectRatio}
                            batchSize={batchSize}
                            setBatchSize={setBatchSize}
                            history={history}
                            setHistory={setHistory}
                        />
                    )}
                </main>
            </div>
        </>
    );
};

export default App;
