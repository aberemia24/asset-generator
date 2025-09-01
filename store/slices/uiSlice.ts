import { StateCreator } from 'zustand';
import { AppMode } from '../../types';
import type { StoreState } from '..';

/**
 * Represents the state and actions for managing the global UI state.
 */
export interface UiSlice {
    mode: AppMode;
    isHistoryOpen: boolean;
    setMode: (mode: AppMode) => void;
    openHistory: () => void;
    closeHistory: () => void;
}

/**
 * Creates a new slice for managing the global UI state.
 * @param set - The Zustand set function.
 * @returns An object containing the state and actions for the UI slice.
 */
export const createUiSlice: StateCreator<StoreState, [], [], UiSlice> = (set) => ({
    mode: 'composition',
    isHistoryOpen: false,
    setMode: (mode) => set({ mode }),
    openHistory: () => set({ isHistoryOpen: true }),
    closeHistory: () => set({ isHistoryOpen: false }),
});