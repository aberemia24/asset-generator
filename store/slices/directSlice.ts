import { StateCreator } from 'zustand';
import { AspectRatio } from '../../types';
import type { StoreState } from '..';

/**
 * Represents the state and actions specific to the Direct Generation Mode.
 */
export interface DirectSlice {
    directPrompt: string;
    directAspectRatio: AspectRatio;
    batchSize: number;
    recentDirectPrompts: string[];
    
    setDirectPrompt: (prompt: string) => void;
    setDirectAspectRatio: (aspectRatio: AspectRatio) => void;
    setBatchSize: (size: number) => void;
    addRecentDirectPrompt: (prompt: string) => void;
}

/**
 * Creates a new slice for managing the Direct Generation Mode state.
 * @param set - The Zustand set function.
 * @returns An object containing the state and actions for the direct generation slice.
 */
export const createDirectSlice: StateCreator<StoreState, [], [], DirectSlice> = (set) => ({
    directPrompt: 'A minimalist, flat vector logo of a brain made of circuits, vibrant blue and green gradient, on a clean white background.',
    directAspectRatio: '1:1',
    batchSize: 1,
    recentDirectPrompts: [],

    setDirectPrompt: (prompt) => set({ directPrompt: prompt }),
    setDirectAspectRatio: (aspectRatio) => set({ directAspectRatio: aspectRatio }),
    setBatchSize: (size) => set({ batchSize: size }),
    
    addRecentDirectPrompt: (prompt) => set((state) => ({
        recentDirectPrompts: [prompt, ...state.recentDirectPrompts.filter(p => p !== prompt)].slice(0, 10)
    })),
});