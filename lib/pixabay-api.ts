
import { UnifiedStockImage, StockImageOrientation } from "../types";

// TODO: Add your Pixabay API key to the environment variables.
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

/**
 * Normalizes the response from the Pixabay API into the app's standard UnifiedStockImage format.
 * @param data - The raw data object from the Pixabay API response.
 * @returns An array of UnifiedStockImage objects.
 */
const normalizePixabayResponse = (data: any): UnifiedStockImage[] => {
    return data.hits.map((hit: any) => ({
        id: `pixabay-${hit.id}`,
        alt: hit.tags || 'Pixabay image',
        photographer: hit.user,
        url: {
            small: hit.webformatURL,
            large: hit.largeImageURL,
        },
        provider: 'pixabay',
    }));
};

/**
 * Converts the app's standard orientation term to the one used by the Pixabay API.
 * @param orientation - The standard orientation ('landscape', 'portrait').
 * @returns The corresponding Pixabay orientation ('horizontal', 'vertical') or 'all'.
 */
const getPixabayOrientation = (orientation: StockImageOrientation) => {
    if (orientation === 'landscape') return 'horizontal';
    if (orientation === 'portrait') return 'vertical';
    return 'all';
};

/**
 * Searches for images on Pixabay based on a query and optional filters.
 * @param query The search term.
 * @param orientation The desired image orientation ('landscape', 'portrait', 'square').
 * @param color The desired color filter (e.g., 'blue', 'red').
 * @returns A promise that resolves with an array of unified stock images. Returns an empty array if the API is not configured or if an error occurs.
 */
export const searchPixabayImages = async (
    query: string,
    orientation: StockImageOrientation,
    color: string
): Promise<UnifiedStockImage[]> => {
    if (!isPixabayConfigured()) {
        return [];
    }

    let url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=12&image_type=photo`;
    
    // Pixabay doesn't support 'square', so it will default to 'all' in that case.
    const pixabayOrientation = getPixabayOrientation(orientation);
    if (pixabayOrientation !== 'all') {
        url += `&orientation=${pixabayOrientation}`;
    }

    if (color && color !== 'any') {
        // Pixabay supports a specific set of colors
        const supportedColors = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "black", "white", "gray"];
        if (supportedColors.includes(color)) {
             url += `&colors=${color}`;
        }
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Pixabay API error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return normalizePixabayResponse(data);
    } catch (error) {
        console.error("Failed to fetch from Pixabay API", error);
        return [];
    }
};

/**
 * Checks if the Pixabay API key is configured in the environment variables.
 * @returns True if the API key is available, false otherwise.
 */
export const isPixabayConfigured = (): boolean => {
    return !!PIXABAY_API_KEY;
};
