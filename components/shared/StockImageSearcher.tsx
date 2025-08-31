

import React, { useState, useActionState, useId } from 'react';
import { searchAllStockSites, areAnyStockApisConfigured } from '../../lib/stock-api';
import { UnifiedStockImage, StockImageOrientation } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from './LoadingSpinner';
import { ToggleGroup, ToggleButton } from '../ui/ToggleGroup';
import Select from '../ui/Select';

interface StockImageSearcherProps {
    onSelectImage: (imageUrl: string, query: string) => void;
}

interface SearchFormState {
    images: UnifiedStockImage[];
    error: string | null;
    query: string;
}

/**
 * React 19 Action to search across all configured stock photo sites.
 * @param previousState - The previous state of the form action.
 * @param formData - The data from the submitted form.
 * @returns The new state for the form action.
 */
async function searchAction(previousState: SearchFormState, formData: FormData): Promise<SearchFormState> {
    const query = formData.get('search-query') as string;
    const orientation = formData.get('orientation') as StockImageOrientation;
    const color = formData.get('color') as string;

    if (!query) {
        return { images: [], error: null, query: '' };
    }

    try {
        const results = await searchAllStockSites({ query, orientation, color });
        if (results.length === 0) {
            return { images: [], error: 'No results found for your search.', query };
        }
        // Simple shuffle to mix results from different providers
        results.sort(() => Math.random() - 0.5);
        return { images: results, error: null, query };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { images: [], error: `Failed to search for images: ${message}`, query };
    }
}

const colorOptions = [
    { value: 'any', label: 'Any Color' },
    { value: 'red', label: 'Red' },
    { value: 'orange', label: 'Orange' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' },
    { value: 'brown', label: 'Brown' },
    { value: 'black', label: 'Black' },
    { value: 'white', label: 'White' },
    { value: 'gray', label: 'Gray' },
];

/**
 * A small badge component to display the stock photo provider on an image thumbnail.
 * @param {object} props - The component props.
 * @param {string} props.provider - The name of the stock photo provider (e.g., 'pexels').
 * @returns {JSX.Element} The rendered provider badge.
 */
const ProviderBadge = ({ provider }: { provider: string }) => (
    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
        {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </span>
);

/**
 * A component that provides a unified search interface for multiple stock photo providers.
 * It includes input fields for query, orientation, and color, and displays the aggregated results in a grid.
 * @param {StockImageSearcherProps} props - The component props.
 * @returns {JSX.Element} The stock image searcher component.
 */
const StockImageSearcher = ({ onSelectImage }: StockImageSearcherProps) => {
    const [searchQuery, setSearchQuery] = useState('minimalist office desk');
    const [orientation, setOrientation] = useState<StockImageOrientation>('any');
    const [color, setColor] = useState('any');
    const [searchState, formAction, isSearching] = useActionState(searchAction, { images: [], error: null, query: '' });
    const formId = useId();

    if (!areAnyStockApisConfigured()) {
        return (
            <div className="p-4 bg-destructive/10 border border-destructive/50 text-destructive rounded-md text-sm">
                <p className="font-bold mb-1">Stock Photo APIs Not Configured</p>
                <p>To use the stock photo search, please add at least one API key (Pexels, Unsplash, or Pixabay) to your environment configuration.</p>
            </div>
        );
    }
    
    const handleSelect = (image: UnifiedStockImage) => {
        onSelectImage(image.url.large, searchState.query);
    }

    return (
        <div className="space-y-4">
            <form action={formAction} className="space-y-3">
                <div className="flex gap-2">
                    <Input
                        type="search"
                        id={`${formId}-search-query`}
                        name="search-query"
                        placeholder="e.g., 'workspace', 'nature'"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button type="submit" disabled={isSearching} className="flex-shrink-0">
                        {isSearching ? <LoadingSpinner size="button" /> : 'Search'}
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor={`${formId}-orientation`} className="text-xs font-medium mb-1.5 block">Orientation</label>
                        <input type="hidden" name="orientation" value={orientation} />
                        <ToggleGroup className="w-full h-9">
                            <ToggleButton state={orientation === 'any' ? 'active' : 'inactive'} onClick={() => setOrientation('any')} className="text-xs px-2 flex-1">Any</ToggleButton>
                            <ToggleButton state={orientation === 'landscape' ? 'active' : 'inactive'} onClick={() => setOrientation('landscape')} className="text-xs px-2 flex-1">Wide</ToggleButton>
                            <ToggleButton state={orientation === 'portrait' ? 'active' : 'inactive'} onClick={() => setOrientation('portrait')} className="text-xs px-2 flex-1">Tall</ToggleButton>
                            <ToggleButton state={orientation === 'square' ? 'active' : 'inactive'} onClick={() => setOrientation('square')} className="text-xs px-2 flex-1">Square</ToggleButton>
                        </ToggleGroup>
                    </div>
                     <div>
                        <label htmlFor={`${formId}-color`} className="text-xs font-medium mb-1.5 block">Color</label>
                        <Select id={`${formId}-color`} name="color" value={color} onChange={e => setColor(e.target.value)} className="h-9">
                            {colorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    </div>
                </div>
            </form>

            {searchState.error && <p role="alert" className="text-sm font-medium text-destructive">{searchState.error}</p>}
            
            <div className="max-h-96 overflow-y-auto pr-2 -mr-2">
                {isSearching ? (
                    <div className="flex justify-center items-center h-48">
                        <LoadingSpinner />
                    </div>
                ) : searchState.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {searchState.images.map(image => (
                            <button
                                type="button"
                                key={image.id}
                                className="aspect-square bg-muted rounded-md overflow-hidden relative group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onClick={() => handleSelect(image)}
                                title={`Photo by ${image.photographer} on ${image.provider}`}
                            >
                                <img src={image.url.small} alt={image.alt} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-sm font-bold p-2 text-center">Use Image</span>
                                </div>
                                <ProviderBadge provider={image.provider} />
                            </button>
                        ))}
                    </div>
                ) : (
                     <div className="flex justify-center items-center h-48 bg-muted rounded-md">
                        <p className="text-muted-foreground text-sm">Search for stock photos to use as a template.</p>
                    </div>
                )}
            </div>
            {searchState.images.length > 0 && 
                <div className="text-xs text-center text-muted-foreground">
                    Photos provided by Pexels, Unsplash, Pixabay.
                </div>
            }
        </div>
    );
};

export default StockImageSearcher;