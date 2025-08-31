
import { UnifiedStockImage, StockImageOrientation } from "../types";
import { searchPexelsImages, isPexelsConfigured } from "./pexels-api";
import { searchUnsplashImages, isUnsplashConfigured } from "./unsplash-api";
import { searchPixabayImages, isPixabayConfigured } from "./pixabay-api";

/**
 * Defines the parameters for a stock image search.
 */
interface SearchParams {
    query: string;
    orientation: StockImageOrientation;
    color: string;
}

/**
 * Searches for images across all configured stock photo providers concurrently.
 * It aggregates the results from all successful API calls into a single array.
 * @param params The search parameters including query, orientation, and color.
 * @returns A promise that resolves with a single aggregated array of unified stock images.
 */
export const searchAllStockSites = async (params: SearchParams): Promise<UnifiedStockImage[]> => {
    const { query, orientation, color } = params;

    const providers = [
        searchPexelsImages(query, orientation, color),
        searchUnsplashImages(query, orientation, color),
        searchPixabayImages(query, orientation, color),
    ];

    const results = await Promise.allSettled(providers);

    const allImages: UnifiedStockImage[] = results
        .filter(result => result.status === 'fulfilled' && Array.isArray(result.value))
        .flatMap(result => (result as PromiseFulfilledResult<UnifiedStockImage[]>).value);

    return allImages;
};

/**
 * Checks if any of the stock photo APIs are configured.
 * This is used to determine whether to render the stock photo search UI.
 * @returns True if at least one API key is available, false otherwise.
 */
export const areAnyStockApisConfigured = (): boolean => {
    return isPexelsConfigured() || isUnsplashConfigured() || isPixabayConfigured();
};
