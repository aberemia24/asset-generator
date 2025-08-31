
# Coding Standards

This document outlines the key rules, patterns, and best practices for all development within the Content Canvas project. Adherence to these standards is mandatory to ensure code quality, maintainability, and scalability.

## Core Principles

-   **SOLID/DRY/KISS**: Adhere to Single Responsibility, Don't Repeat Yourself, and Keep It Simple, Stupid principles.
-   **API Abstraction Layer**: All external API calls (Gemini, Pexels, etc.) **must** be placed in the `/lib` directory. Components should not directly call `fetch` or SDK methods. This isolates dependencies and simplifies component logic.
-   **Type Safety**: The use of `any` is strictly prohibited. Use specific types and interfaces defined in `types.ts` whenever possible.
-   **Search before creating**: Enhance existing components and functions before creating new ones. Look for shared components in `/components/shared` first.

## React & Component Patterns

-   **Component Responsibility**: Components in `/components` should primarily focus on UI. Complex state management and business logic should be handled by React hooks (`useState`, `useEffect`, `useActionState`).
-   **React 19 Actions**: For forms that trigger asynchronous operations, use the `useActionState` hook. This is the preferred pattern for managing form submission state (pending, error, success).
-   **Props Naming**:
    -   Boolean props must be prefixed for clarity (e.g., `isLoading`, `isOpen`).
    -   Event handler props should be prefixed with `on` (e.g., `onClick`, `onSelectImage`).
-   **Error Boundaries**: While not yet implemented, future complex sections should be wrapped in error boundaries to ensure graceful failures.

---

## Naming Conventions

| Element        | Format             | Example                   |
| -------------- | ------------------ | ------------------------- |
| Components     | PascalCase         | `ImageCropper.tsx`        |
| Hooks          | camelCase + `use`  | `useLocalStorage.ts`      |
| Types/Interfaces | PascalCase       | `type HistoryItem = { ... }` |
| Files (non-component) | kebab-case  | `gemini-api.ts`           |
| Constants      | `UPPER_SNAKE_CASE` | `const MAX_RETRIES = 3;`    |

---

## Code Quality & Documentation

-   **JSDoc Required**: All functions in `/lib` and `/utils`, custom hooks, and complex component props must have JSDoc comments explaining their purpose, parameters (`@param`), and return values (`@returns`).
-   **No Suppressions**: Do not use `@ts-ignore` or other type-checking suppressions. If TypeScript raises an error, fix the underlying type issue.
-   **Unused Variables**: Prefix unused function parameters or variables with an underscore (e.g., `_event`, `_unusedVar`). Most ESLint configurations can handle this automatically.

---

## Environment & Security

-   **No Hardcoded Secrets**: API keys and other secrets must **never** be hardcoded. They should be accessed via `process.env` and configured in the deployment environment. Add a `// TODO:` comment in the code to indicate where environment variables are needed.
