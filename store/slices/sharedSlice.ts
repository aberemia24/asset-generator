import { StateCreator } from 'zustand';
import type { StoreState } from '..';

/**
 * Represents state and actions that are shared across multiple modes or components.
 */
export interface SharedSlice {
    negativePrompt: string;
    setNegativePrompt: (prompt: string) => void;
}

/**
 * Creates a new slice for managing shared application state.
 * @param set - The Zustand set function.
 * @returns An object containing the state and actions for the shared slice.
 */
export const createSharedSlice: StateCreator<StoreState, [], [], SharedSlice> = (set) => ({
    negativePrompt: 'blurry, deformed, ugly, text, watermark, signature',
    setNegativePrompt: (prompt) => set({ negativePrompt: prompt }),
});