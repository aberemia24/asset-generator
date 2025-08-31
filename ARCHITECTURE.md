
# Application Architecture

This document provides a technical overview of the "Content Canvas" application's architecture. It is intended for developers working on the project.

## Core Principles

The architecture is designed around modern frontend principles to ensure the application is scalable, maintainable, and easy to reason about.

-   **Modularity & Separation of Concerns:** The codebase is broken down into distinct, feature-oriented modules. UI, state management, and API interactions are strictly separated.
-   **SOLID Principles:** Each component, hook, and service has a single responsibility.
-   **Unidirectional Data Flow:** State flows down from parent components, and events flow up, making the application predictable.

## File Structure

The project follows a structured layout to keep the codebase organized:

```
/
├── public/
├── index.html
├── index.css
├── index.tsx         # Main application entry point
├── App.tsx           # Root component, handles mode switching and history
├── constants.ts      # App-wide constants (e.g., prompt templates)
├── types.ts          # Shared TypeScript type definitions
├── utils.ts          # Pure helper functions (e.g., file converters)
│
├── components/
│   ├── composition/
│   │   └── CompositionMode.tsx      # UI and logic for Composition Mode
│   ├── direct/
│   │   └── DirectGenerationMode.tsx # UI and logic for Direct Generation Mode
│   └── shared/
│       ├── ImageCropper.tsx
│       ├── StockImageSearcher.tsx   # UI and logic for multi-provider search
│       └── ... other shared components
│
├── hooks/
│   └── useLocalStorage.ts           # Hook for persisting state to localStorage
│
└── lib/
    ├── gemini-api.ts          # Abstraction layer for all Google Gemini API calls
    ├── pexels-api.ts          # Client for Pexels API
    ├── unsplash-api.ts        # Client for Unsplash API
    ├── pixabay-api.ts         # Client for Pixabay API
    └── stock-api.ts           # Orchestrator for all stock photo API calls
```

## Module Responsibilities

### Root Level
-   **`App.tsx`**: The main application shell. Its primary responsibilities are:
    -   Managing the active mode (`composition` vs. `direct`).
    -   Holding the centralized state for prompts, history, and other shared settings.
    -   Rendering the appropriate mode's component and the `HistoryDrawer`.

### Components (`/components`)
-   Components are responsible for rendering the UI.
-   Using **React 19 `useActionState`**, components now encapsulate their own async form logic. This pattern co-locates the form's state, the action that mutates it, and the resulting UI feedback (pending states, errors), reducing the need for separate complex hooks for simple form operations.
-   They receive shared state and event handlers as props from `App.tsx`.

### Hooks (`/hooks`)
-   **`useLocalStorage.ts`**: A generic, reusable hook for synchronizing state with the browser's local storage. Used for persisting prompt history.

### Library (`/lib`)
-   **`gemini-api.ts`**: The API Abstraction Layer for Google Gemini.
    -   It is the **only** file that interacts with the `@google/genai` SDK.
    -   It exposes simple, application-specific functions (e.g., `generateTemplateImage`). This isolates the external dependency, making the app easier to maintain.
-   **Stock API Clients (`pexels-api.ts`, etc.)**: Each file is responsible for communicating with a single stock photo provider. They handle fetching, error handling, and normalizing the data into a `UnifiedStockImage` format.
-   **`stock-api.ts`**: This module acts as a facade, providing a single function (`searchAllStockSites`) to search across all configured providers simultaneously. It simplifies the component logic by orchestrating the parallel API calls.

## Data Flow Example (Composition Mode Template Generation)

1.  **User Interaction**: The user types a prompt into the `Textarea` in `CompositionMode.tsx` and clicks the "Generate Template" button.
2.  **Form Action**: The `<form>` element triggers the `templateFormAction`, which is managed by `useActionState`. The hook immediately sets the `isTemplatePending` state to `true`.
3.  **Action Execution**: The `generateTemplateAction` function is invoked with the form data.
4.  **API Call**: The action function calls `generateTemplateImage` from `lib/gemini-api.ts`.
5.  **External API**: `gemini-api.ts` communicates with the Google Gemini API.
6.  **State Update**: Once the API call resolves, the `useActionState` hook updates its state (`templateState`) with the new image URL or an error message and sets `isTemplatePending` to `false`.
7.  **UI Re-render**: The `CompositionMode.tsx` component re-renders. The `useEffect` hook listening to `templateState.image` updates the central history state in `App.tsx`, and the UI displays the newly generated image or an error message.
