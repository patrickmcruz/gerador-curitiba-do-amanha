import { geminiImageGenerationService } from './gemini';

// This is the main export for the image generation service.
// If you add other services (like OpenAI), you can implement logic here
// to switch between them based on configuration or user choice.
export const imageGenerationService = geminiImageGenerationService;
