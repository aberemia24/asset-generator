
import React, { useState, useActionState, useEffect } from 'react';
import { editImage } from '../../lib/gemini-api';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import LoadingSpinner from './LoadingSpinner';

interface ImageEditorProps {
    imageSrc: string;
    onSave: (editedImage: string) => void;
    onClose: () => void;
    negativePrompt: string;
}

interface EditFormState {
    image: string | null;
    error: string | null;
}

/**
 * React 19 Action to perform an AI-powered edit on an image.
 * @param previousState - The previous state of the form action.
 * @param formData - The data from the submitted form.
 * @returns The new state for the form action.
 */
async function editImageAction(previousState: EditFormState, formData: FormData): Promise<EditFormState> {
    const editPrompt = formData.get('edit-prompt') as string;
    const baseImage = formData.get('base-image') as string;
    const negativePrompt = formData.get('negative-prompt') as string;

    if (!editPrompt) return { ...previousState, error: "An edit description is required." };
    if (!baseImage) return { ...previousState, error: "Base image is missing." };

    try {
        const result = await editImage(baseImage, editPrompt, negativePrompt);
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

/**
 * A modal dialog for editing an image using AI.
 * The user provides a text prompt to describe the desired changes.
 * @param {ImageEditorProps} props - The component props.
 * @returns {JSX.Element} The image editor modal.
 */
const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onClose, negativePrompt }) => {
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState('');

    const [editState, formAction, isEditing] = useActionState(editImageAction, { image: null, error: null });

    useEffect(() => {
        if (editState.image) {
            setEditedImage(editState.image);
        }
    }, [editState.image]);

    const handleSave = () => {
        if (editedImage) {
            onSave(editedImage);
        }
    };

    const currentImage = editedImage || imageSrc;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Edit with AI</h2>
                    <Button variant="secondary" onClick={onClose} className="h-8 w-8 p-0 text-xl leading-none" aria-label="Close editor">&times;</Button>
                </header>

                <div className="p-4 flex-grow space-y-4">
                    <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                        {isEditing && <LoadingSpinner />}
                        <img src={currentImage} alt="Image to be edited" className="object-contain h-full w-full" />
                    </div>

                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="base-image" value={imageSrc} />
                        <input type="hidden" name="negative-prompt" value={negativePrompt} />
                        <div>
                             <label htmlFor="edit-prompt" className="text-sm font-medium leading-none mb-1.5 block">Describe your edit:</label>
                            <Textarea
                                id="edit-prompt"
                                name="edit-prompt"
                                placeholder="e.g., 'Add a small, red boat on the water'"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                className="min-h-[80px]"
                                required
                            />
                        </div>
                        {editState.error && <p role="alert" className="text-sm font-medium text-destructive">{editState.error}</p>}
                        <Button type="submit" disabled={isEditing || !editPrompt} className="w-full">
                            {isEditing && <LoadingSpinner size="button" />}
                            {isEditing ? 'Generating...' : 'Generate Edit'}
                        </Button>
                    </form>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!editedImage}>Save</Button>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
