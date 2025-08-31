
import { UnifiedStockImage, StockImageOrientation } from "../types";

// TODO: Add your Unsplash Access Key to the environment variables.
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * Normalizes the response from the Unsplash API into the app's standard UnifiedStockImage format.
 * @param data - The raw data object from the Unsplash API response.
 * @returns An array of UnifiedStockImage objects.
 */
const normalizeUnsplashResponse = (data: any): UnifiedStockImage[] => {
    return data.results.map((photo: any) => ({
        id: `unsplash-${photo.id}`,
        alt: photo.alt_description || 'Unsplash image',
        photographer: photo.user.name,
        url: {
            small: photo.urls.regular,
            large: photo.urls.full,
        },
        provider: 'unsplash',
    }));
};

/**
 * Searches for images on Unsplash based on a query and optional filters.
 * @param query The search term.
 * @param orientation The desired image orientation ('landscape', 'portrait', 'square').
 * @param color The desired color filter (e.g., 'blue', 'red').
 * @returns A promise that resolves with an array of unified stock images. Returns an empty array if the API is not configured or if an error occurs.
 */
export const searchUnsplashImages = async (
    query: string,
    orientation: StockImageOrientation,
    color: string
): Promise<UnifiedStockImage[]> => {
    if (!isUnsplashConfigured()) {
        return [];
    }

    let url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12`;
    if (orientation && orientation !== 'any') {
        url += `&orientation=${orientation}`;
    }
    if (color && color !== 'any') {
        url += `&color=${color}`;
    }

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        });

        if (!response.ok) {
            console.error(`Unsplash API error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return normalizeUnsplashResponse(data);
    } catch (error) {
        console.error("Failed to fetch from Unsplash API", error);
        return [];
    }
};

/**
 * Checks if the Unsplash API key is configured in the environment variables.
 * @returns True if the API key is available, false otherwise.
 */
export const isUnsplashConfigured = (): boolean => {
    return !!UNSPLASH_ACCESS_KEY;
};
