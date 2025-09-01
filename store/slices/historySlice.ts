import { StateCreator } from 'zustand';
import { HistoryItem } from '../../types';
import type { StoreState } from '..';

/**
 * Represents the state and actions for managing the generation history.
 */
export interface HistorySlice {
    history: HistoryItem[];
    addToHistory: (item: HistoryItem | HistoryItem[]) => void;
    deleteHistoryItem: (id: number) => void;
    clearHistory: () => void;
    reuseHistoryItem: (item: HistoryItem) => void;
}

/**
 * Creates a new slice for managing the generation history.
 * @param set - The Zustand set function.
 * @returns An object containing the state and actions for the history slice.
 */
export const createHistorySlice: StateCreator<StoreState, [], [], HistorySlice> = (set) => ({
    history: [],

    addToHistory: (newItem) => set((state) => {
        const itemsToAdd = Array.isArray(newItem) ? newItem : [newItem];
        return { history: [...itemsToAdd, ...state.history].slice(0, 50) };
    }),

    deleteHistoryItem: (id) => set((state) => ({
        history: state.history.filter(item => item.id !== id)
    })),

    clearHistory: () => set({ history: [] }),

    reuseHistoryItem: (item) => set(() => {
        const updates: Partial<StoreState> = {
            negativePrompt: item.negativePrompt,
            isHistoryOpen: false,
        };
        switch (item.type) {
            case 'template':
                updates.mode = 'composition';
                updates.templatePrompt = item.prompt;
                updates.compAspectRatio = item.aspectRatio;
                break;
            case 'final':
                updates.mode = 'composition';
                updates.subjectPrompt = item.prompt;
                updates.compAspectRatio = item.aspectRatio;
                break;
            case 'direct':
                updates.mode = 'direct';
                updates.directPrompt = item.prompt;
                updates.directAspectRatio = item.aspectRatio;
                break;
        }
        return updates;
    }),
});