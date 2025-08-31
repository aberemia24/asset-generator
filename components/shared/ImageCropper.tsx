import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { getCroppedImg } from '../../lib/utils';
import Button from '../ui/Button';
import { AspectRatio } from '../../types';

interface ImageCropperProps {
    imageSrc: string;
    onCropSave: (croppedImage: string) => void;
    onClose: () => void;
    aspect: AspectRatio;
}

const aspectRatios: { value: AspectRatio; text: string }[] = [
    { value: '1:1', text: '1:1' },
    { value: '16:9', text: '16:9' },
    { value: '4:3', text: '4:3' },
    { value: '3:4', text: '3:4' },
    { value: '9:16', text: '9:16' },
];

const getAspectRatioValue = (ratio: AspectRatio): number => {
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
};

/**
 * A modal dialog component for cropping images.
 * It provides controls for zooming and changing the aspect ratio of the crop area.
 * @param {ImageCropperProps} props - The component props.
 * @returns {JSX.Element} The image cropper modal.
 */
const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropSave, onClose, aspect: initialAspect }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(getAspectRatioValue(initialAspect));
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveCrop = async () => {
        if (!imageSrc) return;

        // If no crop selection has been made, 'save' means accept the original.
        if (!croppedAreaPixels) {
            onCropSave(imageSrc);
            return;
        }

        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onCropSave(croppedImage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
                <div className="relative flex-grow">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
                <div className="p-4 border-t border-border flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div>
                            <label htmlFor="zoom" className="text-sm font-medium mr-2">Zoom</label>
                            <input
                                id="zoom"
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="zoom-label"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                        <div>
                            <label htmlFor="aspect" className="text-sm font-medium mr-2">Aspect Ratio</label>
                            <div className="flex flex-wrap gap-2">
                                {aspectRatios.map(ratio => (
                                    <Button
                                        key={ratio.value}
                                        variant={getAspectRatioValue(ratio.value) === aspect ? 'default' : 'secondary'}
                                        onClick={() => setAspect(getAspectRatioValue(ratio.value))}
                                        className="h-8 px-3 text-xs"
                                    >
                                        {ratio.text}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSaveCrop}>Save Crop</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;