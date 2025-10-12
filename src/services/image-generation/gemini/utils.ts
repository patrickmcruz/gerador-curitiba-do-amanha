const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const fileToGenerativePart = async (file: File) => {
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `apiErrors.unsupportedFileType,${file.type || "unknown"}`
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
    throw new Error('apiErrors.invalidBase64');
  }
  return {
    inlineData: { data, mimeType },
  };
};

export const handleApiError = (error: any): string => {
  console.error("Gemini API call failed:", error);
    
  const errorMessage = error.message?.toLowerCase() || "";
  let userMessageKey;

  // Handle specific error messages that are thrown as keys from within the app
  if (errorMessage.startsWith("apiErrors.")) {
      return error.message;
  }

  if (errorMessage.includes("unsupported file type")) {
    const fileType = error.message.split(' ').pop() || 'unknown';
    userMessageKey = `apiErrors.unsupportedFileType,${fileType}`;
  } else if (errorMessage.includes("api key") && errorMessage.includes("invalid")) {
    userMessageKey = "apiErrors.invalidApiKey";
  } else if (
    errorMessage.includes("quota") ||
    errorMessage.includes("billing")
  ) {
    userMessageKey = "apiErrors.quotaExceeded";
  } else if (errorMessage.includes("400")) {
    userMessageKey = "apiErrors.badRequest";
  } else if (
    errorMessage.includes("500") ||
    errorMessage.includes("service")
  ) {
    userMessageKey = "apiErrors.serviceUnavailable";
  } else if (errorMessage.includes("no image was generated")) {
    userMessageKey = "apiErrors.generationFailed";
  } else {
    userMessageKey = "apiErrors.unknown";
  }
  
  return userMessageKey;
};
