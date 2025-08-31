
import React from 'react';
import Button from '../ui/Button';

/**
 * A reusable button component that triggers a browser download for a given image URL.
 * @param {object} props - The component props.
 * @param {string | null} props.imageUrl - The URL of the image to be downloaded.
 * @param {string} props.filename - The default filename for the downloaded image.
 * @returns {JSX.Element | null} A download button, or null if no imageUrl is provided.
 */
const DownloadButton = ({ imageUrl, filename }: { imageUrl: string | null; filename: string }) => {
    if (!imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return <Button onClick={handleDownload} variant="secondary">Download</Button>;
};

export default DownloadButton;
