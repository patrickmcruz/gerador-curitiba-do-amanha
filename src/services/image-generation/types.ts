import { Scenario } from "../../features/image-generator/constants";

export interface ImageGenerationService {
  generateInitialImages(
    imageFile: File,
    year: number,
    scenario: Scenario,
    customPrompt: string
  ): Promise<string[]>;

  refineImageWithText(
    baseImageBase64: string,
    scenario: Scenario,
    modificationPrompt: string,
    customPrompt: string
  ): Promise<string>;

  refineImageWithMask(
    baseImageBase64: string,
    maskImageBase64: string,
    prompt: string
  ): Promise<string>;
}
