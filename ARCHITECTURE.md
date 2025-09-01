# Application Architecture

This document provides a technical overview of the "Content Canvas" application's architecture. It is intended for developers working on the project.

## Core Principles

The architecture is designed around modern frontend principles to ensure the application is scalable, maintainable, and easy to reason about.

-   **Modularity & Separation of Concerns:** The codebase is broken down into distinct, feature-oriented modules. UI, state management, and API interactions are strictly separated.
-   **SOLID Principles:** Each component, hook, and service has a single responsibility.
-   **Unidirectional Data Flow:** State flows from the central Zustand store to components, and events/actions are dispatched from components to update the store, making the application predictable.

## File Structure

The project follows a structured layout to keep the codebase organized:

```
/
├── public/
├── index.html
├── index.css
├── index.tsx         # Main application entry point
├── App.tsx           # Root component, handles mode switching and history drawer
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
├── store/
│   ├── index.ts                 # Main Zustand store setup
│   └── slices/                  # Individual state slices
│
└── lib/
    ├── gemini-api.ts          # Abstraction layer for all Google Gemini API calls
    ├── pexels-api.ts          # Client for Pexels API
    ├── unsplash-api.ts        # Client for Unsplash API
    ├── pixabay-api.ts         # Client for Pixabay API
    ├── stock-api.ts           # Orchestrator for all stock photo API calls
    └── error-handler.ts       # Centralized error logging and user messaging
```

## Module Responsibilities

### Root Level
-   **`App.tsx`**: The main application shell. Its primary responsibilities are:
    -   Rendering the main layout, header, and mode switcher.
    -   Managing the visibility of the `HistoryDrawer`.
    -   Connecting to the Zustand store to pass state down to child components.

### Store (`/store`)
-   **`index.ts`**: Initializes the global Zustand store, combining all slices and configuring middleware (like `persist` for `localStorage`).
-   **Slices (`/store/slices`)**: The state is broken into feature-based slices (e.g., `historySlice`, `compositionSlice`). Each slice contains its own state, and actions that modify that state. This keeps the global state organized and maintainable.

### Components (`/components`)
-   Components are responsible for rendering the UI.
-   Using **React 19 `useActionState`**, components encapsulate their own async form logic. This pattern co-locates the form's state, the action that mutates it, and the resulting UI feedback (pending states, errors).
-   They read from the global `useStore` hook to get the state they need and call actions from the store to update it.

### Library (`/lib`)
-   **`gemini-api.ts`**: The API Abstraction Layer for Google Gemini.
    -   It is the **only** file that interacts with the `@google/genai` SDK.
    -   It exposes simple, application-specific functions (e.g., `generateTemplateImage`). This isolates the external dependency.
-   **Stock API Clients (`pexels-api.ts`, etc.)**: Each file is responsible for communicating with a single stock photo provider, normalizing the data into a `UnifiedStockImage` format.
-   **`stock-api.ts`**: A facade that provides a single function (`searchAllStockSites`) to search across all configured providers simultaneously.
-   **`error-handler.ts`**: Provides centralized error handling and logging.
    -   `logError`: A client-side logging utility that captures detailed technical information.
    -   `handleApiError`: Parses raw errors and generates user-friendly messages for the UI, while also ensuring the technical error is logged.

## Data Flow Example (Composition Mode Template Generation)

1.  **User Interaction**: The user types a prompt into the `Textarea` in `CompositionMode.tsx` and clicks "Generate Template".
2.  **Form Action**: The `<form>` element triggers the `templateFormAction`, managed by `useActionState`. The hook immediately sets `isTemplatePending` to `true`, showing a loading spinner.
3.  **Action Execution**: The `generateTemplateAction` function is invoked with the form data.
4.  **API Call**: The action calls `generateTemplateImage` from `lib/gemini-api.ts`.
5.  **Error Handling**: If the API call fails, the `catch` block in `generateTemplateAction` calls `handleApiError` from `lib/error-handler.ts`. This logs the full technical error and returns a user-friendly error string (e.g., "Your request was blocked due to the safety policy.").
6.  **State Update**: The `useActionState` hook updates its state (`templateState`) with either the new image URL (on success) or the user-friendly error message (on failure). It then sets `isTemplatePending` to `false`.
7.  **UI Re-render**: `CompositionMode.tsx` re-renders. A `useEffect` hook sees the new image in `templateState.image`, calls the `addToHistory` action from the Zustand store, and the UI displays the newly generated image or an error message.