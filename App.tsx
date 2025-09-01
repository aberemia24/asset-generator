

import React from 'react';
import { shallow } from 'zustand/shallow';
import CompositionMode from './components/composition/CompositionMode';
import DirectGenerationMode from './components/direct/DirectGenerationMode';
import { ToggleGroup, ToggleButton } from './components/ui/ToggleGroup';
import HistoryDrawer from './components/shared/HistoryDrawer';
import Button from './components/ui/Button';
import { useStore } from './store';

/**
 * The root component of the Content Canvas application.
 * It uses a global Zustand store to manage state and renders the appropriate
 * UI based on the current mode.
 */
const App = () => {
    // Select state and actions from the Zustand store using shallow equality to prevent unnecessary re-renders.
    const { mode, isHistoryOpen, history } = useStore(
        state => ({
            mode: state.mode,
            isHistoryOpen: state.isHistoryOpen,
            history: state.history,
        }),
        shallow
    );

    const { 
        setMode, 
        openHistory, 
        closeHistory, 
        reuseHistoryItem, 
        deleteHistoryItem, 
        clearHistory 
    } = useStore(
        state => ({
            setMode: state.setMode,
            openHistory: state.openHistory,
            closeHistory: state.closeHistory,
            reuseHistoryItem: state.reuseHistoryItem,
            deleteHistoryItem: state.deleteHistoryItem,
            clearHistory: state.clearHistory,
        }),
        shallow
    );

    return (
        <>
            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={closeHistory}
                history={history}
                onReuse={reuseHistoryItem}
                onDelete={deleteHistoryItem}
                onClear={clearHistory}
            />
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <header className="text-center mb-6 relative">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Content Canvas</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Your integrated AI content generation suite.</p>
                     <Button 
                        variant="secondary" 
                        className="absolute top-0 right-0"
                        onClick={openHistory}
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
                    {mode === 'composition' && <CompositionMode />}
                    {mode === 'direct' && <DirectGenerationMode />}
                </main>
            </div>
        </>
    );
};

export default App;