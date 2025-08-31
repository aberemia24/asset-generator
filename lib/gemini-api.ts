
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio } from "../types";

// Note: This requires the GEMINI_API_KEY environment variable to be set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a single template image from a text prompt.
 * @param prompt The main text prompt describing the desired image.
 * @param negativePrompt A string of keywords to avoid in the image.
 * @param aspectRatio The desired aspect ratio of the image.
 * @returns A promise that resolves to a base64 encoded PNG image string.
 */
export const generateTemplateImage = async (prompt: string, negativePrompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const fullPrompt = negativePrompt ? `${prompt}. AVOID THE FOLLOWING: ${negativePrompt}` : prompt;
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio },
    });
    return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
};

/**
 * Generates a final image by composing a subject with a template, optionally using a style reference.
 * @param subjectPrompt The prompt describing the subject to add or change.
 * @param templateImage The base64 string of the template image (layout).
 * @param styleReferenceImage An optional base64 string of an image to use for artistic style.
 * @param negativePrompt A string of keywords to avoid in the final image.
 * @returns A promise that resolves to a new base64 image string, or null if generation fails.
 */
export const generateFinalImage = async (subjectPrompt: string, templateImage: string, styleReferenceImage: string | null, negativePrompt: string): Promise<string | null> => {
    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [
        { inlineData: { mimeType: 'image/png', data: templateImage.split(',')[1] } },
    ];

    let finalPrompt = subjectPrompt;

    if (styleReferenceImage) {
        parts.push({ inlineData: { mimeType: 'image/png', data: styleReferenceImage.split(',')[1] } });
        finalPrompt = `Using the first image as the base layout and the second image for artistic style reference, ${subjectPrompt}`;
    }

    if (negativePrompt) {
        finalPrompt += `. AVOID THE FOLLOWING: ${negativePrompt}`;
    }

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
};


/**
 * Edits an existing image based on a text prompt (in-painting style).
 * @param baseImage The base64 string of the image to edit.
 * @param editPrompt The text prompt describing the desired changes.
 * @param negativePrompt A string of keywords to avoid in the edited image.
 * @returns A promise that resolves to the edited base64 image string, or null if generation fails.
 */
export const editImage = async (baseImage: string, editPrompt: string, negativePrompt: string): Promise<string | null> => {
    const fullPrompt = negativePrompt ? `${editPrompt}. AVOID THE FOLLOWING: ${negativePrompt}` : editPrompt;
    
    const parts = [
        { inlineData: { mimeType: 'image/png', data: baseImage.split(',')[1] } },
        { text: fullPrompt }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
};

/**
 * Generates variations of an existing image.
 * @param baseImage The base64 string of the image to create variations of.
 * @param negativePrompt A string of keywords to avoid in the variations.
 * @param numberOfVariations The number of variations to generate. Defaults to 2.
 * @returns A promise that resolves to an array of base64 image strings.
 */
export const generateVariations = async (baseImage: string, negativePrompt: string, numberOfVariations: number = 2): Promise<string[]> => {
    const editPrompt = "Generate a slightly different variation of this image, keeping the same subject and overall style.";
    const fullPrompt = negativePrompt ? `${editPrompt}. AVOID THE FOLLOWING: ${negativePrompt}` : editPrompt;

    const parts = [
        { inlineData: { mimeType: 'image/png', data: baseImage.split(',')[1] } },
        { text: fullPrompt }
    ];

    const promises = Array(numberOfVariations).fill(null).map(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    });

    const results = await Promise.all(promises);
    return results.filter((result): result is string => result !== null);
};


/**
 * Generates a batch of images directly from a single text prompt.
 * @param prompt The main text prompt describing the desired images.
 * @param negativePrompt A string of keywords to avoid in the images.
 * @param aspectRatio The desired aspect ratio for all images in the batch.
 * @param batchSize The number of images to generate (typically 1-4).
 * @returns A promise that resolves to an array of base64 encoded PNG image strings.
 */
export const generateDirectImages = async (prompt: string, negativePrompt: string, aspectRatio: AspectRatio, batchSize: number): Promise<string[]> => {
    const fullPrompt = negativePrompt ? `${prompt}. AVOID THE FOLLOWING: ${negativePrompt}` : prompt;
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: { numberOfImages: batchSize, outputMimeType: 'image/png', aspectRatio },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

/**
 * Generates a context-aware negative prompt suggestion based on a main prompt.
 * @param mainPrompt The user's main prompt to analyze.
 * @returns A promise that resolves to a suggested negative prompt string.
 */
export const generateNegativePrompt = async (mainPrompt: string): Promise<string> => {
    if (!mainPrompt.trim()) return '';
    
    const systemInstruction = "You are an expert AI image generation assistant. Your task is to create a concise, effective negative prompt based on a user's main prompt. First, analyze the user's prompt to understand its intent (e.g., creating a logo, a photograph, a vector illustration, etc.). Then, generate a comma-separated list of terms to help the AI avoid common visual artifacts, poor quality, and undesirable elements for that specific intent, as well as general issues like text, watermarks, ugly or deformed features. The output must be 200 characters or less and contain only the comma-separated list.";
    
    const contents = `Generate a negative prompt for the following main prompt: "${mainPrompt}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            systemInstruction,
            maxOutputTokens: 60,
            thinkingConfig: { thinkingBudget: 0 },
            temperature: 0.3,
            topP: 0.95,
        },
    });

    let text = response.text
        .trim()
        .replace(/^"|"$/g, '')
        .replace(/Negative Prompt: /i, '')
        .trim();
        
    return text.slice(0, 200);
};

/**
 * Enhances a user's prompt by adding more descriptive details using an AI model.
 * The enhancement strategy changes based on the provided mode.
 * @param mainPrompt The user's original prompt.
 * @param contextPrompt An optional secondary prompt for context (e.g., the template prompt).
 * @param mode The context of the enhancement ('template', 'subject', or 'direct').
 * @returns A promise that resolves to an enhanced, more detailed prompt string.
 */
export const enhancePrompt = async (
    mainPrompt: string, 
    contextPrompt: string | null = null, 
    mode: 'template' | 'subject' | 'direct' = 'direct'
): Promise<string> => {
    if (!mainPrompt.trim()) return '';

    let systemInstruction = '';
    let contents = '';

    switch (mode) {
        case 'template':
            systemInstruction = "You are an expert AI image generation prompt engineer. Your task is to enhance a user's prompt for a background scene, layout, or environment. Expand on the original concept by adding descriptive keywords related to lighting, composition, mood, and artistic style. Do not add a specific subject. The output should be a single, refined prompt string. Do not output any conversational text.";
            contents = `Enhance this scene prompt: "${mainPrompt}"`;
            break;

        case 'subject':
            systemInstruction = "You are an expert AI image generation prompt engineer. A user wants to add a subject to an existing scene. Your task is to enhance the user's description of the *subject only*. Make it detailed and specific, describing its appearance, texture, and interaction with the environment's lighting. Do not mention the background scene itself in your output. The output should be a single, refined prompt string describing the subject. Do not output any conversational text.";
            contents = `The background scene is: "${contextPrompt}". The subject to add is: "${mainPrompt}". Enhance the description of the subject.`;
            break;
            
        case 'direct':
        default:
            systemInstruction = "You are an expert AI image generation prompt engineer. Your task is to enhance a user's prompt for clarity, detail, and creative potential, following best practices for diffusion models. Expand on the original concept by adding descriptive keywords related to subject, style, medium, lighting, composition, and quality. Do not change the core subject. The output should be a single, refined prompt string. Do not output any conversational text or explanations.";
            contents = `Enhance this prompt: "${mainPrompt}"`;
            break;
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            systemInstruction,
            maxOutputTokens: 250,
            thinkingConfig: { thinkingBudget: 0 },
            temperature: 0.5,
        },
    });

    return response.text.trim().replace(/^"|"$/g, '');
};
