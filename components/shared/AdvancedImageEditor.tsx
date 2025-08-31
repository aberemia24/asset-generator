import React, { useState, useActionState, useEffect, useRef } from 'react';
import { inpaintImage } from '../../lib/gemini-api';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import LoadingSpinner from './LoadingSpinner';
import { ToggleGroup, ToggleButton } from '../ui/ToggleGroup';
import Input from '../ui/Input';

interface AdvancedImageEditorProps {
    imageSrc: string;
    onSave: (editedImage: string) => void;
    onClose: () => void;
    negativePrompt: string;
}

interface EditFormState {
    image: string | null;
    error: string | null;
}

async function editImageAction(previousState: EditFormState, formData: FormData): Promise<EditFormState> {
    const editPrompt = formData.get('edit-prompt') as string;
    const baseImage = formData.get('base-image') as string;
    const maskImage = formData.get('mask-image') as string;
    const negativePrompt = formData.get('negative-prompt') as string;

    if (!editPrompt) return { ...previousState, error: "An edit description is required." };
    if (!baseImage || !maskImage) return { ...previousState, error: "Image data is missing." };

    try {
        const result = await inpaintImage(baseImage, maskImage, editPrompt, negativePrompt);
        if (result) {
            return { image: result, error: null };
        } else {
            return { image: null, error: 'The model did not return an image. Try a different prompt.' };
        }
    } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { image: null, error: `Failed to edit image: ${errorMessage}` };
    }
}

const AdvancedImageEditor: React.FC<AdvancedImageEditorProps> = ({ imageSrc, onSave, onClose, negativePrompt }) => {
    const [mode, setMode] = useState<'inpaint' | 'outpaint'>('inpaint');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [brushSize, setBrushSize] = useState(40);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [padding, setPadding] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
    const originalImageRef = useRef<HTMLImageElement>(null);
    const [originalDims, setOriginalDims] = useState({ width: 0, height: 0 });

    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const [editState, formAction, isEditing] = useActionState(editImageAction, { image: null, error: null });
    const currentImage = resultImage || imageSrc;
    
    // On load or after an edit, get the current image dimensions
    useEffect(() => {
        setIsLoading(true);
        const img = new Image();
        img.src = currentImage;
        img.onload = () => {
            setOriginalDims({ width: img.width, height: img.height });
            setIsLoading(false);
        };
        img.onerror = () => {
            console.error("Failed to load image for editor.");
            setIsLoading(false);
        }
    }, [currentImage]);

    // Handle drawing on the in-paint canvas
    useEffect(() => {
        if (mode !== 'inpaint' || isLoading) return;
        const canvas = maskCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const getCoords = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) / rect.width * canvas.width,
                y: (clientY - rect.top) / rect.height * canvas.height
            };
        }

        const startDrawing = (e: MouseEvent | TouchEvent) => {
            setIsDrawing(true);
            draw(e);
        };
        const stopDrawing = () => setIsDrawing(false);
        const draw = (e: MouseEvent | TouchEvent) => {
            if (!isDrawing) return;
            e.preventDefault();
            const { x, y } = getCoords(e);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchmove', draw, { passive: false });

        return () => {
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseout', stopDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('touchstart', startDrawing);
            canvas.removeEventListener('touchend', stopDrawing);
            canvas.removeEventListener('touchmove', draw);
        };
    }, [isDrawing, brushSize, mode, isLoading]);

    // Update result image from form action
    useEffect(() => {
        if (editState.image) {
            setResultImage(editState.image);
        }
    }, [editState.image]);
    
    const handleSave = () => {
        if (resultImage) onSave(resultImage);
    };

    const clearMask = () => {
        const canvas = maskCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    
    // Generate the base64 data for the base image and mask before submitting
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const baseImageInput = form.elements.namedItem('base-image') as HTMLInputElement;
        const maskImageInput = form.elements.namedItem('mask-image') as HTMLInputElement;

        if (mode === 'inpaint') {
            baseImageInput.value = currentImage; // Use the most recent image
            const maskCanvas = maskCanvasRef.current;
            if (maskCanvas) {
                // Create a solid white shape from the user's semi-transparent drawing
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = maskCanvas.width;
                tempCanvas.height = maskCanvas.height;
                const tempCtx = tempCanvas.getContext('2d')!;
                tempCtx.drawImage(maskCanvas, 0, 0);
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = 'white';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                // Create the final black and white mask
                const finalMaskCanvas = document.createElement('canvas');
                finalMaskCanvas.width = maskCanvas.width;
                finalMaskCanvas.height = maskCanvas.height;
                const finalMaskCtx = finalMaskCanvas.getContext('2d')!;
                finalMaskCtx.fillStyle = 'black';
                finalMaskCtx.fillRect(0, 0, finalMaskCanvas.width, finalMaskCanvas.height);
                finalMaskCtx.drawImage(tempCanvas, 0, 0); // Draw the white shape on the black background
                maskImageInput.value = finalMaskCanvas.toDataURL('image/png');
            }
        } else { // outpaint
            const { width: origW, height: origH } = originalDims;
            const newWidth = origW + padding.left + padding.right;
            const newHeight = origH + padding.top + padding.bottom;
            
            // Create expanded base image with original centered
            const baseCanvas = document.createElement('canvas');
            baseCanvas.width = newWidth;
            baseCanvas.height = newHeight;
            const baseCtx = baseCanvas.getContext('2d')!;
            baseCtx.fillStyle = 'white'; // or some neutral color
            baseCtx.fillRect(0,0,newWidth, newHeight);
            if (originalImageRef.current) {
                 baseCtx.drawImage(originalImageRef.current, padding.left, padding.top, origW, origH);
            }
            baseImageInput.value = baseCanvas.toDataURL('image/png');

            // Create mask (white where we want to paint, black where original is)
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = newWidth;
            maskCanvas.height = newHeight;
            const maskCtx = maskCanvas.getContext('2d')!;
            maskCtx.fillStyle = 'white';
            maskCtx.fillRect(0, 0, newWidth, newHeight);
            maskCtx.fillStyle = 'black';
            maskCtx.fillRect(padding.left, padding.top, origW, origH);
            maskImageInput.value = maskCanvas.toDataURL('image/png');
        }

        formAction(new FormData(form));
    };

    const newWidth = originalDims.width + padding.left + padding.right;
    const newHeight = originalDims.height + padding.top + padding.bottom;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold">Advanced Edit</h2>
                    <Button variant="secondary" onClick={onClose} className="h-8 w-8 p-0 text-xl leading-none" aria-label="Close editor">&times;</Button>
                </header>
                
                <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 min-h-0">
                    <div className="w-full md:w-72 flex-shrink-0 space-y-4">
                         <ToggleGroup className="w-full">
                            <ToggleButton state={mode === 'inpaint' ? 'active' : 'inactive'} onClick={() => setMode('inpaint')} className="flex-1">In-paint</ToggleButton>
                            <ToggleButton state={mode === 'outpaint' ? 'active' : 'inactive'} onClick={() => setMode('outpaint')} className="flex-1">Out-paint</ToggleButton>
                        </ToggleGroup>

                        {mode === 'inpaint' ? (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="brush-size" className="text-sm font-medium mb-2 block">Brush Size: {brushSize}px</label>
                                    <input id="brush-size" type="range" min="10" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                                </div>
                                <Button variant="secondary" onClick={clearMask} className="w-full">Clear Mask</Button>
                                <p className="text-xs text-muted-foreground">Draw a mask over the area you want to change.</p>
                            </div>
                        ) : (
                             <div className="space-y-2">
                                <h3 className="text-sm font-medium">Expand Canvas (in pixels)</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="number" placeholder="Top" value={padding.top || ''} onChange={e => setPadding(p => ({...p, top: parseInt(e.target.value, 10) || 0}))} />
                                    <Input type="number" placeholder="Bottom" value={padding.bottom || ''} onChange={e => setPadding(p => ({...p, bottom: parseInt(e.target.value, 10) || 0}))} />
                                    <Input type="number" placeholder="Left" value={padding.left || ''} onChange={e => setPadding(p => ({...p, left: parseInt(e.target.value, 10) || 0}))} />
                                    <Input type="number" placeholder="Right" value={padding.right || ''} onChange={e => setPadding(p => ({...p, right: parseInt(e.target.value, 10) || 0}))} />
                                </div>
                                {!isLoading && <p className="text-xs text-muted-foreground">New Dimensions: {newWidth} x {newHeight} px</p>}
                             </div>
                        )}
                        
                        <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
                            <input type="hidden" name="base-image" />
                            <input type="hidden" name="mask-image" />
                            <input type="hidden" name="negative-prompt" value={negativePrompt} />
                            <div>
                                <label htmlFor="edit-prompt" className="text-sm font-medium leading-none mb-1.5 block">Describe your edit:</label>
                                <Textarea id="edit-prompt" name="edit-prompt" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} required 
                                placeholder={mode === 'inpaint' ? "e.g., 'a field of wildflowers'" : "e.g., 'a beautiful sunset sky'"}
                                className="min-h-[100px]"
                                />
                            </div>
                            {editState.error && <p role="alert" className="text-sm font-medium text-destructive">{editState.error}</p>}
                            <Button type="submit" disabled={isEditing || !editPrompt || isLoading} className="w-full">
                                {isEditing && <LoadingSpinner size="button" />}
                                {isEditing ? 'Generating...' : 'Generate Edit'}
                            </Button>
                        </form>
                    </div>

                    <div className="flex-grow bg-muted rounded-md flex items-center justify-center overflow-auto p-2 relative min-h-[300px]">
                        {isEditing || isLoading ? <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center"><LoadingSpinner/></div> : null}
                        
                        {!isLoading && mode === 'inpaint' && (
                            <div className="relative" style={{ width: '100%', maxWidth: originalDims.width, aspectRatio: `${originalDims.width}/${originalDims.height}` }}>
                                <img src={currentImage} alt="Image to be edited" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                                <canvas ref={maskCanvasRef} width={originalDims.width} height={originalDims.height} className="absolute inset-0 w-full h-full cursor-crosshair" />
                            </div>
                        )}
                         {!isLoading && mode === 'outpaint' && (
                            <div style={{ width: newWidth, height: newHeight, position: 'relative' }}>
                                 <img ref={originalImageRef} src={currentImage} alt="Image to be expanded" style={{ position: 'absolute', top: padding.top, left: padding.left, width: originalDims.width, height: originalDims.height, outline: '1px dashed hsl(var(--border))' }}/>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-2 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!resultImage}>Save</Button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedImageEditor;
