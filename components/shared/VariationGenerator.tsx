
import React, { useActionState } from 'react';
import { generateVariations } from '../../lib/gemini-api';
import { handleApiError } from '../../lib/error-handler';
import Button from '../ui/Button';
import LoadingSpinner from './LoadingSpinner';

interface VariationGeneratorProps {
    imageSrc: string;
    onSave: (selectedImage: string) => void;
    onClose: () => void;
    negativePrompt: string;
}

interface VariationFormState {
    images: string[];
    error: string | null;
}

/**
 * React 19 Action to generate variations of a base image.
 * @param previousState - The previous state of the form action.
 * @param formData - The data from the submitted form.
 * @returns The new state for the form action.
 */
async function generateVariationsAction(previousState: VariationFormState, formData: FormData): Promise<VariationFormState> {
    const baseImage = formData.get('base-image') as string;
    const negativePrompt = formData.get('negative-prompt') as string;

    if (!baseImage) return { ...previousState, error: "Base image is missing." };

    try {
        const results = await generateVariations(baseImage, negativePrompt, 2); // Generate 2 variations
        if (results.length > 0) {
            return { images: results, error: null };
        } else {
            return { images: [], error: 'The model did not return any variations. Please try again.' };
        }
    } catch (e) {
        const errorMessage = handleApiError(e, { source: 'generateVariationsAction' });
        return { images: [], error: errorMessage };
    }
}

/**
 * A modal dialog for generating AI-powered variations of a given image.
 * It displays the original image alongside newly generated alternatives for the user to select.
 * @param {VariationGeneratorProps} props - The component props.
 * @returns {JSX.Element} The variation generator modal.
 */
const VariationGenerator: React.FC<VariationGeneratorProps> = ({ imageSrc, onSave, onClose, negativePrompt }) => {
    
    const [variationState, formAction, isGenerating] = useActionState(generateVariationsAction, { images: [], error: null });

    const handleSave = (selectedImage: string) => {
        onSave(selectedImage);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Generate Variations</h2>
                    <Button variant="secondary" onClick={onClose} className="h-8 w-8 p-0 text-xl leading-none" aria-label="Close variation generator">&times;</Button>
                </header>

                <div className="p-4 flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto">
                    <div className="flex flex-col gap-2 items-center border-r border-border pr-4">
                        <h3 className="font-medium text-center">Original Image</h3>
                        <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                            <img src={imageSrc} alt="Original image for variation generation" className="object-contain h-full w-full" />
                        </div>
                         <form action={formAction} className="w-full">
                            <input type="hidden" name="base-image" value={imageSrc} />
                            <input type="hidden" name="negative-prompt" value={negativePrompt} />
                            <Button type="submit" disabled={isGenerating} className="w-full mt-2">
                                {isGenerating && <LoadingSpinner size="button" />}
                                {isGenerating ? 'Generating...' : 'Generate 2 Variations'}
                            </Button>
                        </form>
                        {variationState.error && <p role="alert" className="text-sm font-medium text-destructive mt-2">{variationState.error}</p>}
                    </div>

                    <div className="md:col-span-2 flex flex-col">
                         <h3 className="font-medium text-center mb-2">Generated Variations</h3>
                         {isGenerating && (
                            <div className="flex-grow flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                         )}
                         {!isGenerating && variationState.images.length === 0 && (
                             <div className="flex-grow flex items-center justify-center bg-muted rounded-md">
                                <p className="text-muted-foreground">Click "Generate" to create variations.</p>
                            </div>
                         )}
                         {variationState.images.length > 0 && !isGenerating && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {variationState.images.map((img, index) => (
                                    <div key={index} className="flex flex-col gap-2">
                                        <div className="relative w-full aspect-square bg-muted rounded-md overflow-hidden border">
                                            <img src={img} alt={`Variation ${index + 1}`} className="object-cover h-full w-full" />
                                        </div>
                                        <Button onClick={() => handleSave(img)}>Use this image</Button>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default VariationGenerator;