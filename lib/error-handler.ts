/**
 * A simple client-side error logging service.
 * In a real application, this would send logs to a remote service (e.g., Sentry, LogRocket).
 * @param error - The error object to log.
 * @param context - Additional context about where the error occurred.
 */
export const logError = (error: unknown, context: Record<string, any> = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] An error occurred.`, {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        ...context,
    });
};

/**
 * Parses an error and returns a user-friendly message.
 * It also logs the original error for debugging purposes.
 * @param error - The error object to parse.
 * @param context - Additional context for logging.
 * @returns A string containing a user-friendly error message.
 */
export const handleApiError = (error: unknown, context: Record<string, any> = {}): string => {
    // Log the full error first
    logError(error, context);

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Check for specific Gemini API error messages
        if (message.includes('api key not valid')) {
            return 'The Gemini API key is invalid or missing. Please check your configuration.';
        }
        if (message.includes('safety') || message.includes('blocked')) {
            return 'Your request was blocked due to the safety policy. Please modify your prompt and try again.';
        }
        if (message.includes('quota')) {
            return 'You have exceeded your API quota. Please check your Google AI Studio account.';
        }
        if (message.includes('timeout')) {
            return 'The request to the AI model timed out. Please try again in a few moments.';
        }
        
        // Generic network error
        if (message.includes('failed to fetch')) {
            return 'A network error occurred. Please check your internet connection and try again.';
        }
    }

    // Generic fallback message
    return 'An unexpected error occurred. Please try again.';
};
