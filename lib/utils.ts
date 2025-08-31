
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PixelCrop } from '../types';

/**
 * A utility function to merge Tailwind CSS classes without conflicts.
 * @param inputs - A list of class names or class value objects.
 * @returns A string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a File object to a base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

/**
 * Converts an image from a URL to a base64 string by fetching and using a FileReader.
 * This is useful for handling images from external sources (like stock photo APIs)
 * before passing them to other APIs or components that require a base64 string.
 * @param url The URL of the image to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const urlToBase64 = async (url: string): Promise<string> => {
    // NOTE: This can be blocked by CORS policy if the image server doesn't allow cross-origin requests.
    // A server-side proxy would be needed to bypass this in a production environment.
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};


/**
 * Creates an image from a URL, then crops it according to the specified pixel values and returns a new base64 image.
 * @param imageSrc The source image URL (can be base64).
 * @param crop The pixel crop dimensions and position.
 * @returns A promise that resolves with the new cropped base64 image string, or null on failure.
 */
export const getCroppedImg = (imageSrc: string, crop: PixelCrop): Promise<string | null> => {
    const image = new Image();
    image.src = imageSrc;

    return new Promise((resolve, reject) => {
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            canvas.width = crop.width;
            canvas.height = crop.height;

            ctx.drawImage(
                image,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                0,
                0,
                crop.width,
                crop.height
            );

            resolve(canvas.toDataURL('image/png'));
        };
        image.onerror = (error) => reject(error);
    });
};
