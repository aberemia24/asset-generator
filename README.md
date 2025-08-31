
# Content Canvas - AI Content Generation Suite

Content Canvas is a comprehensive internal tool designed to streamline the creation of high-quality visual assets using Google's Gemini AI models. It provides a user-friendly interface for non-technical team members to generate consistent, on-brand images for various needs, from website hero banners to recipe photos and logos.

## Getting Started

### Prerequisites
-   Node.js (v18 or newer recommended)
-   A modern web browser

### Configuration
This application requires API keys to function correctly. As this is a client-side application, these keys will be exposed in the browser. For internal or development use, this is acceptable, but for production, you should move this logic to a backend service.

1.  **Google Gemini API Key**: This is required for all AI image generation features.
2.  **Stock Photo API Keys (Optional)**: To enable the stock photo search, you need at least one of the following:
    -   Pexels API Key
    -   Unsplash Access Key
    -   Pixabay API Key

These keys must be set as environment variables in the execution environment where the app is served. The application code will automatically pick them up via `process.env`.

## Core Features

The application is split into two primary modes, accessible via a toggle at the top of the page.

### 1. Composition Mode
This mode is designed for creating a series of images that share a consistent style and layout. It's a powerful two-step workflow:

-   **Step 1: Create a Template:**
    -   **AI Generation:** Describe a scene, layout, or background (e.g., "a rustic wooden table with an empty plate").
    -   **Stock Photo Search:** Use the integrated search to find a template from Pexels, Unsplash, and Pixabay. Search includes filters for orientation and color.
-   **Step 2: Generate Final Image:**
    -   Describe a subject to add to the selected template (e.g., "a steaming bowl of pasta").
    -   The AI composes the final image, intelligently placing the subject into the template scene.
-   **Style Referencing:** Optionally, upload a reference image to guide the *artistic style* (e.g., color palette, texture) of the final composition while preserving the template's layout.

### 2. Direct Generation Mode
A straightforward text-to-image generator for creating standalone assets.

-   **Single Prompt:** Describe any image you want to create from scratch.
-   **Batch Generation:** Generate up to 4 image variations from a single prompt simultaneously.

### Advanced Features (Available in both modes)

-   **Prompt Assistance:**
    -   **Enhance Prompt:** Automatically improve your prompts with more descriptive details using AI.
    -   **Suggest Negative Prompt:** Generate a list of terms to *avoid* in the image, tailored to your main prompt.
    -   **Presets & Recents:** Quickly access pre-written prompt ideas and your own recent prompts.
-   **Image Editing Suite:**
    -   **Crop:** Adjust the framing of any generated image with a full-featured cropper.
    -   **Edit with AI:** Provide a text prompt to make changes to an image (e.g., "add sunglasses to the person").
    -   **Variations:** Generate slightly different versions of an image to find the perfect one.
-   **History Drawer:** Access your last 5 generations, with the ability to reuse prompts and settings.
-   **Aspect Ratio Control:** Generate images in various formats (16:9, 4:3, 1:1, 3:4, 9:16).
-   **Download & Upload:** Easily save assets locally or upload them to cloud storage (requires Supabase integration).

## Project Structure
```
/
├── components/       # Reusable UI components (shared, direct, composition)
├── lib/              # Core logic and API clients (Gemini, Pexels, etc.)
├── hooks/            # Custom React hooks for state management
├── App.tsx           # Main application component and state management
├── types.ts          # TypeScript type definitions
└── ...               # Configuration and public assets
```

## Limitations & Future Improvements

### Current Limitations
-   **Client-Side API Keys:** All API keys are used directly in the frontend, exposing them to the user. This is not secure for a public-facing application.
-   **No User Persistence:** History is stored in `localStorage` and is limited to the last 5 items. There are no user accounts.
-   **Simulated Uploads:** The "Upload to Storage" feature is a placeholder. It requires integrating a service like Supabase Storage to become functional.
-   **Local State Management:** State is managed within components using React hooks (`useState`, `useActionState`). For a larger application, a global state manager (like Zustand or Redux) would be beneficial.

### Future Improvements Roadmap
1.  **Backend for Key Security:** Create a simple serverless function or backend service to act as a proxy. The frontend would make requests to this backend, which would then securely attach the API keys and forward the requests to the AI/Stock services.
2.  **Full Database Integration:** Replace `localStorage` with a proper database (e.g., Supabase, Firebase) to enable user accounts, persistent generation history, and saved prompts.
3.  **Advanced In-painting/Out-painting:** Implement more granular image editing tools, allowing users to select a specific area of an image to edit or to expand the canvas.
4.  **Video Generation:** Integrate a video generation model (e.g., 'veo-2.0-generate-001') to expand the app's capabilities beyond static images.
5.  **Global State Management:** Introduce a library like Zustand for more robust and scalable state management, especially for user data and history.
6.  **Enhanced Error Handling:** Implement more user-friendly error messages and a logging service to track API failures.
