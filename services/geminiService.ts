import { GoogleGenAI, Modality } from "@google/genai";
import { Scenario } from "../types";

const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileToGenerativePart = async (file: File) => {
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file type: ${
        file.type || "unknown"
      }. Please upload a PNG, JPG, or WEBP image.`
    );
  }
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const base64ToGenerativePart = (base64Data: string, mimeType: string) => {
  const data = base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data;
  if (!data) {
    throw new Error('Invalid base64 data provided.');
  }
  return {
    inlineData: { data, mimeType },
  };
};

const handleApiError = (error: any): string => {
  console.error("Gemini API call failed:", error);
    
  const errorMessage = error.message?.toLowerCase() || "";
  let userMessage;

  if (errorMessage.includes("tipo de arquivo não suportado")) {
      userMessage = error.message;
  } else if (errorMessage.includes("chave de api inválida")) {
    userMessage = "Chave de API inválida. Certifique-se de que ela esteja configurada corretamente.";
  } else if (
    errorMessage.includes("quota") ||
    errorMessage.includes("billing")
  ) {
    userMessage =
      "Cota de API excedida. Por favor verifique seu plano e detalhes de cobrança.";
  } else if (errorMessage.includes("400")) {
    userMessage =
      "Requisição inválida. A imagem enviada pode estar em formato não suportado, quebrada ou muito longa.";
  } else if (
    errorMessage.includes("500") ||
    errorMessage.includes("service")
  ) {
    userMessage =
      "O serviço de IA está temporariamente indisponível. Por favor tente novamente mais tarde.";
  } else if (errorMessage.includes("nenhuma imagem foi gerada")) {
    userMessage = error.message; // Use the specific message for safety refusals
  } else {
    userMessage = error.message || "Ocorreu um erro desconhecido. Por favor tente novamente.";
  }
  
  return userMessage;
};

export const generateInitialImages = async (
  imageFile: File,
  year: number,
  scenario: Scenario,
  customPrompt: string
): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("Chave API_KEY não configurada.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = await fileToGenerativePart(imageFile);

    let promptText = `Re-imagine this image of Curitiba, Brazil, showing what it would look like ${year} years in the future in a ${scenario.label} scenario. ${scenario.description}`;
    if (customPrompt.trim()) {
      promptText += ` Please incorporate these specific details: "${customPrompt}".`;
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

    // Make 3 parallel calls to generate 3 variations
    const imagePromises = [generateSingleImage(), generateSingleImage(), generateSingleImage()];
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

export const refineImageWithText = async (
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

    let promptText = `This is a futuristic image of Curitiba, Brazil, in a ${scenario.label} scenario.`;
    if (customPrompt.trim()) {
        promptText += ` The original creation was guided by this description: "${customPrompt}".`;
    }
    promptText += ` Please generate a variation of this image that incorporates the following change: "${modificationPrompt}". Maintain the overall futuristic ${scenario.label} theme.`;

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

export const refineImageWithMask = async (
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

        const instructionalPrompt = `Using the second image provided as a mask (where the white areas indicate where to apply the change), please edit the first image. Apply the following change only to the masked area: "${prompt}". Return only the modified full image.`;

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