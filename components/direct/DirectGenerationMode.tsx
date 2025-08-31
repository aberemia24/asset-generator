

import React, { useState, useActionState, useEffect } from 'react';
import { CommonGenerationParams, AspectRatio, HistoryItem } from '../../types';
import { generateDirectImages, generateNegativePrompt, enhancePrompt } from '../../lib/gemini-api';
import LoadingSpinner from '../shared/LoadingSpinner';
import DownloadButton from '../shared/DownloadButton';
import UploadButton from '../shared/UploadButton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import useLocalStorage from '../../hooks/useLocalStorage';
import RecentPromptsDropdown from '../shared/RecentPromptsDropdown';
import ImageCropper from '../shared/ImageCropper';
import PresetPromptsDropdown from '../shared/PresetPromptsDropdown';
import AdvancedImageEditor from '../shared/AdvancedImageEditor';
import VariationGenerator from '../shared/VariationGenerator';

interface DirectGenerationModeProps extends CommonGenerationParams {
    directPrompt: string;
    setDirectPrompt: React.Dispatch<React.SetStateAction<string>>;
    aspectRatio: AspectRatio;
    setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>;
    batchSize: number;
    setBatchSize: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * A UI group component that standardizes the layout for a label and its associated form element.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The form element (e.g., Input, Select).
 * @param {string} [props.label] - The text label for the form element.
 * @param {string} [props.htmlFor] - The ID of the form element for the `for` attribute.
 * @returns {JSX.Element} A styled div containing a label and its child element.
 */
const FormGroup = ({ children, label, htmlFor }: { children: React.ReactNode; label?: string; htmlFor?: string; }) => (
    <div className="grid w-full items-center gap-1.5">
        {label && <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
        {children}
    </div>
);

const aspectRatioClasses: Record<AspectRatio, string> = {
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '3:4': 'aspect-[3/4]',
    '9:16': 'aspect-[9/16]',
};

/**
 * A reusable Sparkles icon component.
 * @param {React.SVGProps<SVGSVGElement>} props - SVG properties.
 * @returns {JSX.Element} The rendered SVG icon.
 */
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /><path d="M14 4h1" /><path d="M9 20h1" /><path d="M12 4V2" /><path d="M12 22v-2" /><path d="m19 5-9 9" /><path d="m5 19 9-9" />
    </svg>
);

// --- React 19 Form Action ---

interface DirectFormState {
    images: string[];
    error: string | null;
    promptUsed?: { prompt: string; timestamp: number };
}

/**
 * React 19 Action to generate a batch of images directly from a prompt.
 * @param previousState - The previous state of the form action.
 * @param formData - The data from the submitted form.
 * @returns The new state for the form action.
 */
async function generateDirectAction(previousState: DirectFormState, formData: FormData): Promise<DirectFormState> {
    const prompt = formData.get('direct-prompt') as string;
    const negativePrompt = formData.get('negative-prompt') as string;
    const aspectRatio = formData.get('direct-aspect-ratio') as AspectRatio;
    const batchSize = parseInt(formData.get('batch-size') as string, 10) || 1;

    if (!prompt) return { ...previousState, error: "Prompt is required." };
    
    try {
        const urls = await generateDirectImages(prompt, negativePrompt, aspectRatio, batchSize);
        return { images: urls, error: null, promptUsed: { prompt, timestamp: Date.now() } };
    } catch (e) {
        console.error(e);
        return { images: [], error: 'Failed to generate images.' };
    }
}

/**
 * Manages the UI and logic for the "Direct Generation" mode.
 * This mode provides a simple text-to-image interface for creating standalone assets,
 * with options for batch generation and various aspect ratios.
 */
const DirectGenerationMode = ({
    negativePrompt, setNegativePrompt,
    directPrompt, setDirectPrompt,
    aspectRatio, setAspectRatio,
    batchSize, setBatchSize,
    history, setHistory
}: DirectGenerationModeProps) => {
    const [isGeneratingNegative, setIsGeneratingNegative] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [recentDirectPrompts, setRecentDirectPrompts] = useLocalStorage<string[]>('recentDirectPrompts', []);
    
    const [displayImages, setDisplayImages] = useState<string[]>([]);
    const [croppingState, setCroppingState] = useState<{ index: number; src: string } | null>(null);
    const [advancedEditingState, setAdvancedEditingState] = useState<{ index: number; src: string } | null>(null);
    const [variationState, setVariationState] = useState<{ index: number; src: string } | null>(null);

    const [directState, directFormAction, isDirectPending] = useActionState(generateDirectAction, { images: [], error: null });

    // --- Effect Hooks ---

    // Add successful prompt to recent prompts list
    useEffect(() => {
        if (directState.promptUsed) {
            const currentPrompt = directState.promptUsed.prompt;
            setRecentDirectPrompts(prev => 
                [currentPrompt, ...prev.filter(p => p !== currentPrompt)].slice(0, 5)
            );
        }
    }, [directState.promptUsed]);

    // Handle results from form action: update UI and history
    useEffect(() => {
        setDisplayImages(directState.images);
        if (directState.images.length > 0 && directState.promptUsed) {
            const newHistoryItems: HistoryItem[] = directState.images.map((image, index) => ({
                id: Date.now() + index,
                type: 'direct',
                image,
                prompt: directState.promptUsed?.prompt || '',
                negativePrompt,
                timestamp: Date.now(),
                aspectRatio,
            }));
            setHistory(prev => [...newHistoryItems, ...prev].slice(0, 5));
        }
    }, [directState.images]);
    
    // --- Event Handlers ---

    const handleAutoNegativePrompt = async () => {
        setIsGeneratingNegative(true);
        try {
            const newNegativePrompt = await generateNegativePrompt(directPrompt);
            setNegativePrompt(newNegativePrompt);
        } catch (error) {
            console.error("Failed to generate negative prompt:", error);
        } finally {
            setIsGeneratingNegative(false);
        }
    };

    const handleEnhanceDirectPrompt = async () => {
        setIsEnhancing(true);
        try {
            const newPrompt = await enhancePrompt(directPrompt, null, 'direct');
            setDirectPrompt(newPrompt);
        } catch (error) {
            console.error("Failed to enhance direct prompt:", error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleCropSave = (croppedImage: string) => {
        if (croppingState === null) return;
        
        const newImages = [...displayImages];
        newImages[croppingState.index] = croppedImage;
        setDisplayImages(newImages);
        
        setCroppingState(null);
    };

    const handleAdvancedEditSave = (editedImage: string) => {
        if (advancedEditingState === null) return;
        
        const newImages = [...displayImages];
        newImages[advancedEditingState.index] = editedImage;
        setDisplayImages(newImages);
        
        setAdvancedEditingState(null);
    };

     const handleVariationSave = (selectedImage: string) => {
        if (variationState === null) return;
        
        const newImages = [...displayImages];
        newImages[variationState.index] = selectedImage;
        setDisplayImages(newImages);
        
        setVariationState(null);
    };

    return (
        <>
            {croppingState && (
                <ImageCropper
                    imageSrc={croppingState.src}
                    onCropSave={handleCropSave}
                    onClose={() => setCroppingState(null)}
                    aspect={aspectRatio}
                />
            )}
             {advancedEditingState && (
                <AdvancedImageEditor
                    imageSrc={advancedEditingState.src}
                    onSave={handleAdvancedEditSave}
                    onClose={() => setAdvancedEditingState(null)}
                    negativePrompt={negativePrompt}
                />
            )}
            {variationState && (
                <VariationGenerator
                    imageSrc={variationState.src}
                    onSave={handleVariationSave}
                    onClose={() => setVariationState(null)}
                    negativePrompt={negativePrompt}
                />
            )}
            <Card className="max-w-4xl mx-auto">
                <form action={directFormAction}>
                    <CardHeader>
                        <CardTitle>Direct Generation</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <div className="flex justify-between items-center">
                                <label htmlFor="direct-prompt" className="text-sm font-medium leading-none">Describe the image you want to create:</label>
                                <div className="flex items-center gap-2">
                                    <PresetPromptsDropdown onSelect={setDirectPrompt} />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="h-auto px-2 py-1 text-xs"
                                        onClick={handleEnhanceDirectPrompt}
                                        disabled={isEnhancing || !directPrompt}
                                        title="Enhance prompt with AI"
                                    >
                                        {isEnhancing ? <LoadingSpinner size="button" className="h-4 w-4" /> : <SparklesIcon />}
                                        <span className="ml-1.5">Enhance</span>
                                    </Button>
                                    <RecentPromptsDropdown prompts={recentDirectPrompts} onSelect={setDirectPrompt} />
                                </div>
                            </div>
                            <Textarea id="direct-prompt" name="direct-prompt" value={directPrompt} onChange={(e) => setDirectPrompt(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormGroup label="Aspect Ratio" htmlFor="direct-aspect-ratio">
                                <Select id="direct-aspect-ratio" name="direct-aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}>
                                    <option value="1:1">Square (1:1)</option>
                                    <option value="16:9">Wide (16:9)</option>
                                    <option value="4:3">Landscape (4:3)</option>
                                    <option value="3:4">Portrait (3:4)</option>
                                    <option value="9:16">Tall (9:16)</option>
                                </Select>
                            </FormGroup>
                            <FormGroup label="Number of Images" htmlFor="batch-size">
                                <Input type="number" id="batch-size" name="batch-size" value={batchSize} onChange={e => setBatchSize(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))} min="1" max="4" />
                            </FormGroup>
                        </div>
                        <details className="bg-muted/50 rounded-lg">
                            <summary className="px-4 py-2 text-sm font-medium cursor-pointer">Advanced Controls</summary>
                            <div className="p-4 border-t border-border">
                                <div className="grid w-full items-center gap-1.5">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="negative-prompt-direct" className="text-sm font-medium leading-none">Negative Prompt (what to avoid)</label>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="h-auto px-2 py-1 text-xs"
                                            onClick={handleAutoNegativePrompt}
                                            disabled={isGeneratingNegative || !directPrompt}
                                            title="Auto-generate based on main prompt"
                                        >
                                            {isGeneratingNegative ? <LoadingSpinner size="button" className="h-4 w-4" /> : <SparklesIcon />}
                                            <span className="ml-1.5">Suggest</span>
                                        </Button>
                                    </div>
                                    <div>
                                        <Textarea
                                            id="negative-prompt-direct"
                                            name="negative-prompt"
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            maxLength={200}
                                            className="min-h-[80px] resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground text-right w-full mt-1">{`${negativePrompt.length} / 200`}</p>
                                    </div>
                                </div>
                            </div>
                        </details>
                        
                        {directState.error && <p role="alert" className="text-sm font-medium text-destructive mt-2">{directState.error}</p>}
                        
                        {isDirectPending && <div className="flex justify-center items-center p-8"><LoadingSpinner /></div>}

                        {displayImages.length > 0 && !isDirectPending &&
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                {displayImages.map((img, index) => (
                                    <div key={index} className="flex flex-col gap-2">
                                        <div className={`relative w-full bg-muted rounded-md overflow-hidden border ${aspectRatioClasses[aspectRatio]}`}>
                                            <img src={img} alt={`Generated image ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button type="button" variant="secondary" onClick={() => setCroppingState({ index, src: img })}>
                                                Crop
                                            </Button>
                                            <Button type="button" variant="secondary" onClick={() => setAdvancedEditingState({ index, src: img })}>
                                                Advanced Edit
                                            </Button>
                                            <Button type="button" variant="secondary" onClick={() => setVariationState({ index, src: img })}>
                                                Variations
                                            </Button>
                                            <DownloadButton imageUrl={img} filename={`direct-gen-${index}-${Date.now()}.png`} />
                                            <UploadButton imageUrl={img} filename={`direct-gen-${index}-${Date.now()}.png`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isDirectPending} className="w-full">
                            {isDirectPending && <LoadingSpinner size="button" />}
                            {isDirectPending ? `Generating ${batchSize} image(s)...` : 'Generate'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </>
    );
};

export default DirectGenerationMode;