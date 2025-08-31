

import React, { useState, useActionState, useEffect } from 'react';
import { CommonGenerationParams, AspectRatio, HistoryItem } from '../../types';
import { cn, fileToBase64, urlToBase64 } from '../../lib/utils';
import { generateTemplateImage, generateFinalImage, generateNegativePrompt, enhancePrompt } from '../../lib/gemini-api';
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
import { ToggleGroup, ToggleButton } from '../ui/ToggleGroup';
import StockImageSearcher from '../shared/StockImageSearcher';


interface CompositionModeProps extends CommonGenerationParams {
    templatePrompt: string;
    setTemplatePrompt: React.Dispatch<React.SetStateAction<string>>;
    subjectPrompt: string;
    setSubjectPrompt: React.Dispatch<React.SetStateAction<string>>;
    aspectRatio: AspectRatio;
    setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>;
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

// --- SVG Icons ---
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
/**
 * A reusable Info icon component.
 * @param {React.SVGProps<SVGSVGElement>} props - SVG properties.
 * @returns {JSX.Element} The rendered SVG icon.
 */
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
    </svg>
);
/**
 * A reusable Chevron Down icon component.
 * @param {React.SVGProps<SVGSVGElement>} props - SVG properties.
 * @returns {JSX.Element} The rendered SVG icon.
 */
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);


// --- React 19 Form Actions ---

interface TemplateFormState {
    image: string | null;
    error: string | null;
    promptUsed?: { prompt: string; timestamp: number };
}

/**
 * React 19 Action to generate a template image.
 * This function is called when the template generation form is submitted.
 * @param previousState - The previous state of the form action.
 * @param formData - The data from the submitted form.
 * @returns The new state for the form action.
 */
async function generateTemplateAction(previousState: TemplateFormState, formData: FormData): Promise<TemplateFormState> {
    const prompt = formData.get('template-prompt') as string;
    const negativePrompt = formData.get('negative-prompt') as string;
    const aspectRatio = formData.get('aspect-ratio') as AspectRatio;

    if (!prompt) return { ...previousState, error: "Template prompt is required." };

    try {
        const result = await generateTemplateImage(prompt, negativePrompt, aspectRatio);
        return { image: result, error: null, promptUsed: { prompt, timestamp: Date.now() } };
    } catch (e) {
        console.error(e);
        return { image: null, error: 'Failed to generate template image.' };
    }
}

interface FinalImageFormState {
    image: string | null;
    error: string | null;
    promptUsed?: { prompt: string; timestamp: number };
}

/**
 * React 19 Action to generate the final composed image.
 * This function is called when the final image generation form is submitted.
 * @param previousState - The previous state of the form action.
 * @param formData - The data from the submitted form.
 * @returns The new state for the form action.
 */
async function generateFinalImageAction(previousState: FinalImageFormState, formData: FormData): Promise<FinalImageFormState> {
    const subjectPrompt = formData.get('subject-prompt') as string;
    const negativePrompt = formData.get('negative-prompt') as string;
    const selectedTemplate = formData.get('selected-template') as string;
    const styleRefFile = formData.get('style-ref') as File | null;

    if (!subjectPrompt) return { ...previousState, error: "Subject prompt is required." };
    if (!selectedTemplate) return { ...previousState, error: "A template must be selected." };
    
    let styleReferenceImage: string | null = null;
    if (styleRefFile && styleRefFile.size > 0) {
        try {
            styleReferenceImage = await fileToBase64(styleRefFile);
        } catch (err) {
            console.error(err);
            return { image: null, error: "Could not process the style reference image." };
        }
    }

    try {
        const result = await generateFinalImage(subjectPrompt, selectedTemplate, styleReferenceImage, negativePrompt);
        if (result) {
            return { image: result, error: null, promptUsed: { prompt: subjectPrompt, timestamp: Date.now() } };
        } else {
            return { image: null, error: 'The model did not return an image. Try adjusting your prompt.' };
        }
    } catch (e) {
        console.error(e);
        return { image: null, error: 'Failed to generate final image.' };
    }
}

/**
 * Manages the UI and logic for the two-step "Composition Mode".
 * This mode allows users to first create a background/template image
 * and then add a subject to it, with an optional style reference.
 * It handles state for prompts, images, and user interactions for this workflow.
 */
const CompositionMode = ({
    negativePrompt, setNegativePrompt,
    templatePrompt, setTemplatePrompt,
    subjectPrompt, setSubjectPrompt,
    aspectRatio, setAspectRatio,
    history, setHistory
}: CompositionModeProps) => {
    const [templateSource, setTemplateSource] = useState<'ai' | 'stock'>('ai');
    const [styleReferenceImage, setStyleReferenceImage] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [isGeneratingNegative, setIsGeneratingNegative] = useState(false);
    const [isEnhancingTemplate, setIsEnhancingTemplate] = useState(false);
    const [isEnhancingSubject, setIsEnhancingSubject] = useState(false);
    const [isConvertingStock, setIsConvertingStock] = useState(false);
    
    const [displayTemplateImage, setDisplayTemplateImage] = useState<string | null>(null);
    const [displayFinalImage, setDisplayFinalImage] = useState<string | null>(null);
    const [croppingState, setCroppingState] = useState<{ type: 'template' | 'final'; src: string } | null>(null);
    const [advancedEditingState, setAdvancedEditingState] = useState<{ type: 'template' | 'final'; src: string } | null>(null);
    const [variationState, setVariationState] = useState<{ type: 'template' | 'final'; src: string } | null>(null);

    const [recentTemplatePrompts, setRecentTemplatePrompts] = useLocalStorage<string[]>('recentTemplatePrompts', []);
    const [recentSubjectPrompts, setRecentSubjectPrompts] = useLocalStorage<string[]>('recentSubjectPrompts', []);

    const [templateState, templateFormAction, isTemplatePending] = useActionState(generateTemplateAction, { image: null, error: null });
    const [finalImageState, finalImageFormAction, isFinalImagePending] = useActionState(generateFinalImageAction, { image: null, error: null });

    // --- Effect Hooks ---
    
    // Add successful prompts to recent prompts list
    useEffect(() => {
        if (templateState.promptUsed) {
            const currentPrompt = templateState.promptUsed.prompt;
            setRecentTemplatePrompts(prev => 
                [currentPrompt, ...prev.filter(p => p !== currentPrompt)].slice(0, 5)
            );
        }
    }, [templateState.promptUsed]);

    useEffect(() => {
        if (finalImageState.promptUsed) {
            const currentPrompt = finalImageState.promptUsed.prompt;
            setRecentSubjectPrompts(prev => 
                [currentPrompt, ...prev.filter(p => p !== currentPrompt)].slice(0, 5)
            );
        }
    }, [finalImageState.promptUsed]);

    // Handle results from form actions: update UI and history
    useEffect(() => {
        if (templateState.image) {
            setSelectedTemplate(templateState.image);
            setDisplayTemplateImage(templateState.image);
            const newHistoryItem: HistoryItem = {
                id: Date.now(),
                type: 'template',
                image: templateState.image,
                prompt: templateState.promptUsed?.prompt || '',
                negativePrompt,
                timestamp: Date.now(),
                aspectRatio,
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
        }
    }, [templateState.image]);
    
    useEffect(() => {
        if (finalImageState.image) {
            setDisplayFinalImage(finalImageState.image);
            const newHistoryItem: HistoryItem = {
                id: Date.now(),
                type: 'final',
                image: finalImageState.image,
                prompt: finalImageState.promptUsed?.prompt || '',
                negativePrompt,
                timestamp: Date.now(),
                aspectRatio,
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
        }
    }, [finalImageState.image]);

    // --- Event Handlers ---

    const handleStyleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            setStyleReferenceImage(base64);
        } else {
            setStyleReferenceImage(null);
        }
    };

    const handleAutoNegativePrompt = async () => {
        setIsGeneratingNegative(true);
        try {
            const newNegativePrompt = await generateNegativePrompt(templatePrompt);
            setNegativePrompt(newNegativePrompt);
        } catch (error) {
            console.error("Failed to generate negative prompt:", error);
        } finally {
            setIsGeneratingNegative(false);
        }
    };

    const handleEnhanceTemplatePrompt = async () => {
        setIsEnhancingTemplate(true);
        try {
            const newPrompt = await enhancePrompt(templatePrompt, null, 'template');
            setTemplatePrompt(newPrompt);
        } catch (error) {
            console.error("Failed to enhance template prompt:", error);
        } finally {
            setIsEnhancingTemplate(false);
        }
    };

    const handleEnhanceSubjectPrompt = async () => {
        setIsEnhancingSubject(true);
        try {
            const newPrompt = await enhancePrompt(subjectPrompt, templatePrompt, 'subject');
            setSubjectPrompt(newPrompt);
        } catch (error) {
            console.error("Failed to enhance subject prompt:", error);
        } finally {
            setIsEnhancingSubject(false);
        }
    };
    
    const handleCropSave = (croppedImage: string) => {
        if (croppingState?.type === 'template') {
            setDisplayTemplateImage(croppedImage);
            if (selectedTemplate === croppingState.src) { // if the cropped image was the selected one, update it
                setSelectedTemplate(croppedImage);
            }
        } else if (croppingState?.type === 'final') {
            setDisplayFinalImage(croppedImage);
        }
        setCroppingState(null);
    };

    const handleAdvancedEditSave = (editedImage: string) => {
        if (advancedEditingState?.type === 'template') {
            setDisplayTemplateImage(editedImage);
            if (selectedTemplate === advancedEditingState.src) {
                setSelectedTemplate(editedImage);
            }
        } else if (advancedEditingState?.type === 'final') {
            setDisplayFinalImage(editedImage);
        }
        setAdvancedEditingState(null);
    };

    const handleVariationSave = (selectedImage: string) => {
        if (variationState?.type === 'template') {
            setDisplayTemplateImage(selectedImage);
            if (selectedTemplate === variationState.src) {
                setSelectedTemplate(selectedImage);
            }
        } else if (variationState?.type === 'final') {
            setDisplayFinalImage(selectedImage);
        }
        setVariationState(null);
    };
    
    const handleStockImageSelect = async (imageUrl: string, query: string) => {
        setIsConvertingStock(true);
        setDisplayTemplateImage(null); // Clear previous image
        try {
            const base64Image = await urlToBase64(imageUrl);
            setDisplayTemplateImage(base64Image);
            setSelectedTemplate(base64Image);
            
            const newHistoryItem: HistoryItem = {
                id: Date.now(),
                type: 'template',
                image: base64Image,
                prompt: `Stock image: ${query}`,
                negativePrompt: '',
                timestamp: Date.now(),
                aspectRatio, // This might not match perfectly but is a reasonable guess
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 5));

        } catch (error) {
            console.error("Failed to convert stock image:", error);
            // You could set an error state here to show in the UI
        } finally {
            setIsConvertingStock(false);
        }
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <form action={templateFormAction}>
                        <CardHeader>
                            <CardTitle>Step 1: Create Template</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <ToggleGroup className="w-full">
                                <ToggleButton state={templateSource === 'ai' ? 'active' : 'inactive'} onClick={() => setTemplateSource('ai')} className="flex-1">
                                    Generate with AI
                                </ToggleButton>
                                <ToggleButton state={templateSource === 'stock' ? 'active' : 'inactive'} onClick={() => setTemplateSource('stock')} className="flex-1">
                                    Search Stock Photos
                                </ToggleButton>
                            </ToggleGroup>
                            
                            {templateSource === 'ai' ? (
                                <>
                                    <div className="grid w-full items-center gap-1.5">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="template-prompt" className="text-sm font-medium leading-none">Describe the scene or layout:</label>
                                            <div className="flex items-center gap-2">
                                                <PresetPromptsDropdown onSelect={setTemplatePrompt} />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="h-auto px-2 py-1 text-xs"
                                                    onClick={handleEnhanceTemplatePrompt}
                                                    disabled={isEnhancingTemplate || !templatePrompt}
                                                    title="Enhance prompt with AI"
                                                >
                                                    {isEnhancingTemplate ? <LoadingSpinner size="button" className="h-4 w-4" /> : <SparklesIcon />}
                                                    <span className="ml-1.5">Enhance</span>
                                                </Button>
                                                <RecentPromptsDropdown prompts={recentTemplatePrompts} onSelect={setTemplatePrompt} />
                                            </div>
                                        </div>
                                        <Textarea id="template-prompt" name="template-prompt" value={templatePrompt} onChange={(e) => setTemplatePrompt(e.target.value)} />
                                    </div>
                                    <FormGroup label="Aspect Ratio" htmlFor="aspect-ratio">
                                        <Select id="aspect-ratio" name="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}>
                                            <option value="16:9">Wide (16:9)</option>
                                            <option value="4:3">Landscape (4:3)</option>
                                            <option value="1:1">Square (1:1)</option>
                                            <option value="3:4">Portrait (3:4)</option>
                                            <option value="9:16">Tall (9:16)</option>
                                        </Select>
                                    </FormGroup>
                                    <details className="bg-muted/50 rounded-lg">
                                        <summary className="px-4 py-2 text-sm font-medium cursor-pointer">Advanced Controls</summary>
                                        <div className="p-4 border-t border-border">
                                            <div className="grid w-full items-center gap-1.5">
                                                <div className="flex justify-between items-center">
                                                    <label htmlFor="negative-prompt-comp" className="text-sm font-medium leading-none">Negative Prompt (what to avoid)</label>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="h-auto px-2 py-1 text-xs"
                                                        onClick={handleAutoNegativePrompt}
                                                        disabled={isGeneratingNegative || !templatePrompt}
                                                        title="Auto-generate based on template prompt"
                                                    >
                                                        {isGeneratingNegative ? <LoadingSpinner size="button" className="h-4 w-4" /> : <SparklesIcon />}
                                                        <span className="ml-1.5">Suggest</span>
                                                    </Button>
                                                </div>
                                                <div>
                                                    <Textarea
                                                        id="negative-prompt-comp"
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
                                </>
                             ) : (
                                <StockImageSearcher onSelectImage={handleStockImageSelect} />
                             )}

                            {templateState.error && <p role="alert" className="text-sm font-medium text-destructive">{templateState.error}</p>}
                            <div className={`relative w-full bg-muted rounded-md overflow-hidden border flex items-center justify-center transition-all ${aspectRatioClasses[aspectRatio]} ${displayTemplateImage && selectedTemplate === displayTemplateImage ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''}`}>
                                {(isTemplatePending || isConvertingStock) && <LoadingSpinner />}
                                {displayTemplateImage && !(isTemplatePending || isConvertingStock) && (
                                    <>
                                        <img src={displayTemplateImage} alt="Generated template" className="absolute inset-0 w-full h-full object-cover" />
                                        {selectedTemplate === displayTemplateImage && (
                                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold shadow-lg">
                                                Selected
                                            </div>
                                        )}
                                    </>
                                )}
                                {!(isTemplatePending || isConvertingStock) && !displayTemplateImage && <span className="text-sm text-muted-foreground">Preview</span>}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            {templateSource === 'ai' && (
                                <Button type="submit" disabled={isTemplatePending} className="w-full">
                                    {isTemplatePending && <LoadingSpinner size="button" />}
                                    {isTemplatePending ? 'Generating...' : 'Generate Template'}
                                </Button>
                            )}
                             <div className="flex flex-col gap-2 w-full">
                                <Button type="button" onClick={() => setSelectedTemplate(displayTemplateImage)} disabled={!displayTemplateImage || selectedTemplate === displayTemplateImage}>
                                    {selectedTemplate === displayTemplateImage ? 'Template Selected' : 'Use This Template'}
                                </Button>
                                <div className="flex flex-wrap gap-2 w-full">
                                    <Button type="button" variant="secondary" onClick={() => displayTemplateImage && setCroppingState({ type: 'template', src: displayTemplateImage })} disabled={!displayTemplateImage}>
                                        Crop
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => displayTemplateImage && setAdvancedEditingState({ type: 'template', src: displayTemplateImage })} disabled={!displayTemplateImage}>
                                        Advanced Edit
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => displayTemplateImage && setVariationState({ type: 'template', src: displayTemplateImage })} disabled={!displayTemplateImage}>
                                        Variations
                                    </Button>
                                    <DownloadButton imageUrl={displayTemplateImage} filename={`template-${Date.now()}.png`} />
                                    <UploadButton imageUrl={displayTemplateImage} filename={`template-${Date.now()}.png`} />
                                </div>
                            </div>
                        </CardFooter>
                    </form>
                </Card>

                <Card className={!selectedTemplate ? 'opacity-50 pointer-events-none' : ''}>
                    <form action={finalImageFormAction}>
                        <input type="hidden" name="selected-template" value={selectedTemplate || ''} />
                        <input type="hidden" name="negative-prompt" value={negativePrompt} />
                        <CardHeader>
                            <CardTitle>Step 2: Generate Final Image</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className={`relative w-full bg-muted rounded-md overflow-hidden border ring-2 ring-offset-2 ring-offset-background ring-primary ${aspectRatioClasses[aspectRatio]}`}>
                                {selectedTemplate && <img src={selectedTemplate} alt="Selected template" className="absolute inset-0 w-full h-full object-cover" />}
                                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-semibold">TEMPLATE</div>
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="subject-prompt" className="text-sm font-medium leading-none">Describe the subject to add or change:</label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="h-auto px-2 py-1 text-xs"
                                            onClick={handleEnhanceSubjectPrompt}
                                            disabled={isEnhancingSubject || !subjectPrompt}
                                            title="Enhance prompt with AI"
                                        >
                                            {isEnhancingSubject ? <LoadingSpinner size="button" className="h-4 w-4" /> : <SparklesIcon />}
                                            <span className="ml-1.5">Enhance</span>
                                        </Button>
                                        <RecentPromptsDropdown prompts={recentSubjectPrompts} onSelect={setSubjectPrompt} />
                                    </div>
                                </div>
                                <Textarea id="subject-prompt" name="subject-prompt" value={subjectPrompt} onChange={(e) => setSubjectPrompt(e.target.value)} />
                            </div>
                           <details className="bg-muted/50 rounded-lg group">
                                <summary className="px-4 py-3 text-sm font-medium cursor-pointer flex justify-between items-center list-none">
                                    <span>Style Reference (Optional)</span>
                                    <ChevronDownIcon className="group-open:rotate-180 transition-transform"/>
                                </summary>
                                <div className="p-4 border-t border-border space-y-4">
                                    <div className="flex items-start gap-3 bg-accent/50 p-3 rounded-md">
                                        <InfoIcon className="w-5 h-5 mt-0.5 text-accent-foreground flex-shrink-0" />
                                        <p className="text-sm text-accent-foreground">
                                            Upload an image to guide the <strong>artistic style</strong> (e.g., colors, textures). 
                                            The layout from your template will be preserved.
                                        </p>
                                    </div>
                                    <FormGroup>
                                         <label htmlFor="style-ref" className={cn(
                                            "w-full text-center p-4 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-muted",
                                            styleReferenceImage ? 'hidden' : 'block'
                                         )}>
                                            Click to upload an image
                                        </label>
                                        <Input className="sr-only" type="file" id="style-ref" name="style-ref" accept="image/*" onChange={handleStyleReferenceUpload} />
                                        {styleReferenceImage && 
                                            <div className="relative w-32 h-32">
                                                <img src={styleReferenceImage} alt="Style reference preview" className="rounded-md object-cover w-full h-full" />
                                                <button type="button" onClick={() => {
                                                    setStyleReferenceImage(null);
                                                    const fileInput = document.getElementById('style-ref') as HTMLInputElement;
                                                    if(fileInput) fileInput.value = '';
                                                }} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-lg font-bold">&times;</button>
                                            </div>
                                        }
                                    </FormGroup>
                                </div>
                            </details>
                            {finalImageState.error && <p role="alert" className="text-sm font-medium text-destructive">{finalImageState.error}</p>}
                            <div className={`relative w-full bg-muted rounded-md overflow-hidden border flex items-center justify-center ${aspectRatioClasses[aspectRatio]}`}>
                                {isFinalImagePending && <LoadingSpinner />}
                                {displayFinalImage && !isFinalImagePending && <img src={displayFinalImage} alt="Final generated image" className="absolute inset-0 w-full h-full object-cover" />}
                                {!isFinalImagePending && !displayFinalImage && <span className="text-sm text-muted-foreground">Preview</span>}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" disabled={isFinalImagePending} className="w-full">
                                {isFinalImagePending && <LoadingSpinner size="button" />}
                                {isFinalImagePending ? 'Generating...' : 'Generate Final Image'}
                            </Button>
                            <div className="flex flex-wrap gap-2 w-full">
                                <Button type="button" variant="secondary" onClick={() => displayFinalImage && setCroppingState({ type: 'final', src: displayFinalImage })} disabled={!displayFinalImage}>
                                    Crop
                                </Button>
                                 <Button type="button" variant="secondary" onClick={() => displayFinalImage && setAdvancedEditingState({ type: 'final', src: displayFinalImage })} disabled={!displayFinalImage}>
                                    Advanced Edit
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => displayFinalImage && setVariationState({ type: 'final', src: displayFinalImage })} disabled={!displayFinalImage}>
                                    Variations
                                </Button>
                                <DownloadButton imageUrl={displayFinalImage} filename={`final-image-${Date.now()}.png`} />
                                <UploadButton imageUrl={displayFinalImage} filename={`final-image-${Date.now()}.png`} />
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
};

export default CompositionMode;