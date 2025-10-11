const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const fileToGenerativePart = async (file: File) => {
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

export const base64ToGenerativePart = (base64Data: string, mimeType: string) => {
  const data = base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data;
  if (!data) {
    throw new Error('Invalid base64 data provided.');
  }
  return {
    inlineData: { data, mimeType },
  };
};

export const handleApiError = (error: any): string => {
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
