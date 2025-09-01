
import { UnifiedStockImage, StockImageOrientation } from "../types";
import { logError } from "./error-handler";

// TODO: Add your Pexels API key to the environment variables.
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

/**
 * Normalizes the response from the Pexels API into the app's standard UnifiedStockImage format.
 * @param data - The raw data object from the Pexels API response.
 * @returns An array of UnifiedStockImage objects.
 */
const normalizePexelsResponse = (data: any): UnifiedStockImage[] => {
    return data.photos.map((photo: any) => ({
        id: `pexels-${photo.id}`,
        alt: photo.alt || 'Pexels image',
        photographer: photo.photographer,
        url: {
            small: photo.src.medium,
            large: photo.src.large2x,
        },
        provider: 'pexels',
    }));
};

/**
 * Searches for images on Pexels based on a query and optional filters.
 * @param query The search term.
 * @param orientation The desired image orientation ('landscape', 'portrait', 'square').
 * @param color The desired color filter (e.g., 'blue', 'red').
 * @returns A promise that resolves with an array of unified stock images. Returns an empty array if the API is not configured or if an error occurs.
 */
export const searchPexelsImages = async (
    query: string,
    orientation: StockImageOrientation,
    color: string
): Promise<UnifiedStockImage[]> => {
    if (!isPexelsConfigured()) {
        return [];
    }

    let url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12`;
    if (orientation && orientation !== 'any') {
        url += `&orientation=${orientation}`;
    }
    if (color && color !== 'any') {
        url += `&color=${color}`;
    }

    try {
        const response = await fetch(url, {
            headers: { Authorization: PEXELS_API_KEY! },
        });

        if (!response.ok) {
            logError(new Error(`Pexels API error: ${response.status}`), { source: 'searchPexelsImages', query });
            return [];
        }

        const data = await response.json();
        return normalizePexelsResponse(data);
    } catch (error) {
        logError(error, { source: 'searchPexelsImages', query });
        return [];
    }
};

/**
 * Checks if the Pexels API key is configured in the environment variables.
 * @returns True if the API key is available, false otherwise.
 */
export const isPexelsConfigured = (): boolean => {
    return !!PEXELS_API_KEY;
};