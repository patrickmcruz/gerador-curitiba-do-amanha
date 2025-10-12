import { GoogleGenAI, Modality } from "@google/genai";
import { Scenario } from "../../../features/image-generator/constants";
import { ImageGenerationService } from "../types";
import { fileToGenerativePart, base64ToGenerativePart, handleApiError } from './utils';


const generateInitialImages = async (
  imageFile: File,
  year: number,
  scenario: Scenario,
  customPrompt: string,
  numberOfGenerations: number
): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("Chave API_KEY não configurada.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = await fileToGenerativePart(imageFile);

    let promptText = `Photorealistic re-imagination of this cityscape image from Curitiba, Brazil. Project it ${year} years into the future, adopting a ${scenario.label} perspective. Focus on architectural changes, technological integration, and environmental aspects. ${scenario.description}`;
    if (customPrompt.trim()) {
      promptText += ` Please also incorporate these specific user-requested details: "${customPrompt}".`;
    }
    
    const textPart = { text: promptText };

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
      throw new Error(
        "Nenhuma imagem foi gerada. A modelo pode ter recusado a solicitação devido a políticas de segurança."
      );
    }
    return generatedImages;
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

const refineImageWithText = async (
  baseImageBase64: string,
  scenario: Scenario,
  modificationPrompt: string,
  customPrompt: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Variável de ambiente API_KEY não definida.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = base64ToGenerativePart(baseImageBase64, "image/png");

    let promptText = `This is a photorealistic, futuristic image of Curitiba, Brazil, in a ${scenario.label} scenario.`;
    if (customPrompt.trim()) {
        promptText += ` The original creation was guided by this description: "${customPrompt}".`;
    }
    promptText += ` Generate a new version of this image that incorporates this specific modification: "${modificationPrompt}". It's crucial to maintain the established futuristic ${scenario.label} aesthetic, focusing on architecture, technology, and environment.`;

    const textPart = { text: promptText };

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
      throw new Error(
        "Nenhuma imagem foi gerada. A modelo pode ter recusado a solicitação devido a políticas de segurança."
      );
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
        throw new Error("Variavel de ambiente API_KEY nao configurada.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const baseImagePart = base64ToGenerativePart(baseImageBase64, 'image/png');
        const maskImagePart = base64ToGenerativePart(maskImageBase64, 'image/png');

        const instructionalPrompt = `You are an expert photo editor. Use the second image as a mask on the first image. The white area of the mask indicates the region to be modified. Apply the following instruction ONLY to the masked region: "${prompt}". The rest of the image must remain unchanged. Return only the complete, edited image.`;

        const textPart = { text: instructionalPrompt };

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
          throw new Error("Nenhuma imagem gerada. O modelo pode ter recusado a requisição devido a políticas de segurança.");
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