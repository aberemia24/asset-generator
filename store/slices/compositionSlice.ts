import { StateCreator } from 'zustand';
import { AspectRatio } from '../../types';
import type { StoreState } from '..';

/**
 * Represents the state and actions specific to the Composition Mode.
 */
export interface CompositionSlice {
    templatePrompt: string;
    subjectPrompt: string;
    compAspectRatio: AspectRatio;
    recentTemplatePrompts: string[];
    recentSubjectPrompts: string[];
    
    setTemplatePrompt: (prompt: string) => void;
    setSubjectPrompt: (prompt: string) => void;
    setCompAspectRatio: (aspectRatio: AspectRatio) => void;
    addRecentTemplatePrompt: (prompt: string) => void;
    addRecentSubjectPrompt: (prompt: string) => void;
}

/**
 * Creates a new slice for managing the Composition Mode state.
 * @param set - The Zustand set function.
 * @returns An object containing the state and actions for the composition slice.
 */
export const createCompositionSlice: StateCreator<StoreState, [], [], CompositionSlice> = (set) => ({
    templatePrompt: 'A professional photo scene. A minimalist office desk with a laptop and a coffee cup sits by a window with soft morning light.',
    subjectPrompt: 'Add a new smartphone displaying a colorful chart on the desk.',
    compAspectRatio: '16:9',
    recentTemplatePrompts: [],
    recentSubjectPrompts: [],

    setTemplatePrompt: (prompt) => set({ templatePrompt: prompt }),
    setSubjectPrompt: (prompt) => set({ subjectPrompt: prompt }),
    setCompAspectRatio: (aspectRatio) => set({ compAspectRatio: aspectRatio }),
    
    addRecentTemplatePrompt: (prompt) => set((state) => ({
        recentTemplatePrompts: [prompt, ...state.recentTemplatePrompts.filter(p => p !== prompt)].slice(0, 10)
    })),
    addRecentSubjectPrompt: (prompt) => set((state) => ({
        recentSubjectPrompts: [prompt, ...state.recentSubjectPrompts.filter(p => p !== prompt)].slice(0, 10)
    })),
});