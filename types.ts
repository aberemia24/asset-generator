

import { Dispatch, SetStateAction } from 'react';

/** Defines the possible aspect ratios for image generation. */
export type AspectRatio = '1:1' | '16:9' | '4:3' | '3:4' | '9:16';

/** Defines the primary modes of the application. */
export type AppMode = 'composition' | 'direct';

/**
 * Represents a single generated image stored in the user's history.
 */
export interface HistoryItem {
    /** A unique identifier for the history item, typically a timestamp. */
    id: number;
    /** The type of generation process used. */
    type: 'template' | 'final' | 'direct';
    /** The base64-encoded string of the generated image. */
    image: string;
    /** The main prompt used for the generation. */
    prompt: string;
    /** The negative prompt used for the generation. */
    negativePrompt: string;
    /** The Unix timestamp of when the item was created. */
    timestamp: number;
    /** The aspect ratio of the generated image. */
    aspectRatio: AspectRatio;
}

/**
 * Represents the dimensions and position of a crop area in pixels.
 */
export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}


// --- Unified Stock Image Types ---

/** Defines the supported stock photo providers. */
export type StockProvider = 'pexels' | 'unsplash' | 'pixabay';

/** Defines the possible orientations for stock photo search. */
export type StockImageOrientation = 'any' | 'landscape' | 'portrait' | 'square';

/**
 * Represents a standardized structure for an image from any stock photo provider.
 * This allows for consistent handling of data from different APIs.
 */
export interface UnifiedStockImage {
    /** A unique identifier, typically a combination of provider and original ID. */
    id: string;
    /** The alternative text for the image. */
    alt: string;
    /** The name of the photographer. */
    photographer: string;
    /** An object containing URLs for different image sizes. */
    url: {
        /** A URL for a smaller, thumbnail-sized image. */
        small: string;
        /** A URL for a larger, high-quality image. */
        large: string;
    };
    /** The provider from which the image was sourced. */
    provider: StockProvider;
}