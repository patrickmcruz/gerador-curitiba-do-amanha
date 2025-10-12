import { GoogleGenAI, Modality } from "@google/genai";
import { ImageGenerationService } from "../types";
import { fileToGenerativePart, base64ToGenerativePart, handleApiError } from './utils';


const generateInitialImages = async (
  imageFile: File,
  prompt: string,
  numberOfGenerations: number
): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("apiErrors.apiKeyMissing");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: prompt };

    const generateSingleImage = async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [imagePart, textPart],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content?.parts || []) {
          if (part.inlineData) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    };

    const imagePromises = Array.from({ length: numberOfGenerations }, () => generateSingleImage());
    const results = await Promise.all(imagePromises);
    const generatedImages = results.filter((img): img is string => img !== null);


    if (generatedImages.length === 0) {
      throw new Error("apiErrors.generationFailed");
    }
    return generatedImages;
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

const refineImageWithText = async (
  baseImageBase64: string,
  prompt: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("apiErrors.apiKeyMissing");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = base64ToGenerativePart(baseImageBase64, "image/png");
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let generatedImage: string | null = null;
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content?.parts || []) {
        if (part.inlineData) {
          generatedImage = part.inlineData.data;
          break;
        }
      }
    }

    if (!generatedImage) {
      throw new Error("apiErrors.generationFailed");
    }
    return generatedImage;
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

const refineImageWithMask = async (
  baseImageBase64: string,
  maskImageBase64: string,
  prompt: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("apiErrors.apiKeyMissing");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const baseImagePart = base64ToGenerativePart(baseImageBase64, 'image/png');
        const maskImagePart = base64ToGenerativePart(maskImageBase64, 'image/png');
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
                parts: [baseImagePart, maskImagePart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        let generatedImage: string | null = null;
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content?.parts || []) {
                if (part.inlineData) {
                    generatedImage = part.inlineData.data;
                    break;
                }
            }
        }

        if (!generatedImage) {
          throw new Error("apiErrors.generationFailed");
        }
        return generatedImage;
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const geminiImageGenerationService: ImageGenerationService = {
  generateInitialImages,
  refineImageWithText,
  refineImageWithMask,
};
