
import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import Button from '../ui/Button';

/**
 * A button that handles uploading a generated image to a storage service.
 * NOTE: The current implementation simulates the upload process.
 * To enable real uploads, the Supabase (or other cloud storage) integration must be completed.
 * @param {object} props - The component props.
 * @param {string | null} props.imageUrl - The base64 URL of the image to upload.
 * @param {string} props.filename - The desired filename for the uploaded file.
 * @returns {JSX.Element | null} A button to trigger the upload process, or null if no image URL is provided.
 */
const UploadButton = ({ imageUrl, filename }: { imageUrl: string | null; filename:string }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleUpload = async () => {
        if (!imageUrl) return;

        setIsUploading(true);
        setUploadSuccess(false);
        setUploadError(null);

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: blob.type });

            // --- TODO: Supabase Integration Point ---
            // To enable uploads, you need to configure your Supabase client and uncomment this section.
            // Ensure you have a 'your-bucket' in your Supabase storage.
            // import { supabase } from '../../lib/supabase-client'; // Example import
            // const { data, error } = await supabase.storage.from('your-bucket').upload(`public/${file.name}`, file);
            // if (error) throw error;
            // ------------------------------------

            // Simulate network request for demonstration purposes
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (e) {
            const errorMessage = (e instanceof Error) ? e.message : 'An unknown error occurred.';
            setUploadError(`Upload failed: ${errorMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    if (!imageUrl) return null;

    return (
        <div>
            <Button 
                onClick={handleUpload} 
                disabled={isUploading || uploadSuccess} 
                variant="secondary"
            >
                {isUploading && <LoadingSpinner size="button" />}
                <span className={isUploading ? 'ml-2': ''}>{isUploading ? 'Uploading...' : (uploadSuccess ? 'Uploaded!' : 'Upload to Storage')}</span>
            </Button>
            {uploadError && <p className="text-sm font-medium text-destructive mt-2">{uploadError}</p>}
        </div>
    );
};

export default UploadButton;
