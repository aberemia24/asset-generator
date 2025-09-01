
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCompositionSlice, CompositionSlice } from './slices/compositionSlice';
import { createDirectSlice, DirectSlice } from './slices/directSlice';
import { createHistorySlice, HistorySlice } from './slices/historySlice';
import { createSharedSlice, SharedSlice } from './slices/sharedSlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';

/**
 * The combined application state, merging all individual slices.
 */
export type StoreState = CompositionSlice & DirectSlice & HistorySlice & SharedSlice & UiSlice;

/**
 * The main Zustand store for the application.
 * It uses a sliced architecture for better organization and scalability.
 * State persistence is handled by the `persist` middleware, which saves
 * history and recent prompts to localStorage.
 */
// Fix: Correctly type the store by explicitly providing the state type to the `persist` middleware.
// This allows TypeScript to correctly infer the store's type for the hook and its selectors,
// resolving incorrect type inference for the store hook and its selectors.
export const useStore = create(
    persist<StoreState>(
        (set, get, api) => ({
            ...createCompositionSlice(set, get, api),
            ...createDirectSlice(set, get, api),
            ...createHistorySlice(set, get, api),
            ...createSharedSlice(set, get, api),
            ...createUiSlice(set, get, api),
        }),
        {
            name: 'content-canvas-store',
            // Only persist the parts of the state that need to survive a page refresh.
            partialize: (state) => ({
                history: state.history,
                recentTemplatePrompts: state.recentTemplatePrompts,
                recentSubjectPrompts: state.recentSubjectPrompts,
                recentDirectPrompts: state.recentDirectPrompts,
            }),
        }
    )
);
