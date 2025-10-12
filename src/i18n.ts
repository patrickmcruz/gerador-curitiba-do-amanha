import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const translationEN = {
  "app": {
    "title": "Hipervisor - Curitiba of Tomorrow"
  },
  "header": {
    "title": "Hipervisor <1>Curitiba of Tomorrow</1>",
    "subtitle": "Upload your own image to see Curitiba re-imagined by AI"
  },
  "footer": {
    "text": "Developed by Hipervisor / IPPUC. An exploration of AI-driven creativity."
  },
  "settings": {
    "title": "Application Settings",
    "imageGeneration": {
      "title": "Image Generation",
      "label": "Number of images generated at a time",
      "description": "Choose how many image variations are created with each click of \"Re-imagine The Future\"."
    },
    "devMode": {
      "title": "Developer Mode",
      "label": "DEV Mode",
      "description": "When enabled, the app generates mock images locally without using the Gemini API.",
      "on": "Enabled",
      "off": "Disabled"
    },
    "language": {
      "title": "Language",
      "description": "Select the interface language. Prompts sent to the AI will use the selected language.",
      "pt-BR": "Portuguese (BR)",
      "en": "English (USA)"
    },
    "scenarioDefaults": {
      "title": "Scenario Defaults",
      "label": "Pre-fill default scenario descriptions",
      "description": "When enabled, the 'Optimistic' and 'Pessimistic' scenarios will start with a pre-filled description based on common themes. Disable this if you prefer to start with a blank slate.",
      "on": "Enabled",
      "off": "Disabled"
    },
    "timeTravel": {
      "title": "Time Travel",
      "directionLabel": "Direction",
      "future": "Future",
      "past": "Past",
      "yearsLabel": "Years to travel",
      "description": "Choose to see the city in the future or the past, and how many years to travel."
    },
    "buttons": {
      "save": "Save Settings",
      "cancel": "Cancel",
      "reset": "Reset Defaults"
    }
  },
  "scenarioForm": {
    "title": "Customize Scenarios",
    "scenarioLabel": "Button Text",
    "scenarioDescription": "AI Prompt Description",
    "remove": "Remove",
    "add": "+ Add new scenario",
    "save": "Save changes",
    "cancel": "Cancel",
    "scenario": "Scenario",
    "removeAria": "Remove {{label}} scenario",
    "labelPlaceholder": "e.g., Solar Punk",
    "descriptionPlaceholder": "Describe the desired aesthetic for the AI...",
    "newScenarioLabel": "New Scenario",
    "newScenarioDescription": "A custom description for the new scenario."
  },
  "imageGenerator": {
    "uploadTitle": "1. Upload image",
    "scenarioTitle": "2. Choose a scenario",
    "resultTitle": "3. See the Result",
    "manageScenarios": "Scenarios",
    "settings": "Settings",
    "customPromptLabel": "Custom Prompt (optional)",
    "customPromptPlaceholder": "e.g., with many pedestrians on the sidewalks, lots of cars on the roads...",
    "promptSuggestions": "Prompt Suggestions",
    "newSuggestions": "New suggestions",
    "generateButton": "Re-imagine The Future",
    "generatingButton": "Generating the Future...",
    "promptError": "Add a description to the scenario or a custom prompt to continue.",
    "uploadError": "Please upload an image first.",
    "refineTitle": "4. Refine the Result",
    "editWithMask": "Edit with Mask (Beta)",
    "or": "OR",
    "refinePlaceholder": "e.g., add more people, remove trees...",
    "refineButton": "Generate Variation (Text)",
    "refiningButton": "Refining...",
    "refineError": "Please describe the changes you want to make.",
    "refineSelectionError": "An image must be generated and selected first to create a variation.",
    "tabResult": "Result",
    "tabHistory": "History",
    "clearPrompt": "Clear prompt",
    "undoPrompt": "Undo prompt change",
    "redoPrompt": "Redo prompt change"
  },
  "imageUploader": {
    "title": "1. Upload image",
    "dragAndDrop": "<0>Click to upload</0> or drag and drop",
    "fileTypes": "PNG, JPG, WEBP",
    "uploadedImageAlt": "Uploaded image",
    "changeImage": "Change Image",
    "fullscreenTitle": "Original image preview"
  },
  "imageDisplay": {
    "subtitle": "{{timeTravelPrefix}}: {{timeLabel}} {{yearsLabel}} ({{scenarioLabel}}) - Variation {{selectedIndex}}/{{total}}",
    "timeTravelPrefix": "Time Travel",
    "yearsLabel_one": "Year",
    "yearsLabel_other": "Years",
    "placeholder": "Your generated image will appear here",
    "variation": "Variation {{index}}",
    "undo": "Undo",
    "redo": "Redo",
    "refine": "Refine image",
    "fullscreen": "Fullscreen",
    "download": "Download",
    "downloadAll": "Download All",
    "compare": "Compare with original",
    "close": "Close fullscreen",
    "fullscreenTitle": "Fullscreen image view",
    "prev": "Previous image",
    "next": "Next image",
    "originalLabel": "Original",
    "generatedLabel": "Generated",
    "zipError": "Could not download all images. JSZip library not found.",
    "zipCreateError": "Failed to create zip file. See console for details."
  },
  "history": {
    "title": "Generation History",
    "clear": "Clear History",
    "placeholder": "The history of your generations will appear here.",
    "restore": "Restore",
    "revertError": "Could not restore history (snapshot not found).",
    "entry": {
      "initial": "Initial Generation",
      "refinement": "Text Refinement",
      "mask_edit": "Magic Edit",
      "default": "Generation"
    },
    "timeAgo": {
      "now": "just now",
      "seconds_one": "{{count}} second ago",
      "seconds_other": "{{count}} seconds ago",
      "minutes_one": "{{count}} minute ago",
      "minutes_other": "{{count}} minutes ago",
      "hours_one": "{{count}} hour ago",
      "hours_other": "{{count}} hours ago",
      "days_one": "{{count}} day ago",
      "days_other": "{{count}} days ago",
      "months_one": "{{count}} month ago",
      "months_other": "{{count}} months ago",
      "years_one": "{{count}} year ago",
      "years_other": "{{count}} years ago"
    }
  },
  "maskEditor": {
    "title": "Magic Edit",
    "promptPlaceholder": "Describe what you want to change in the masked area...",
    "generate": "Generate",
    "generating": "Generating...",
    "brushSize": "Brush Size",
    "undo": "Undo",
    "clear": "Clear mask"
  },
  "scenarios": [
    { "label": "Optimistic", "value": "Optimistic", "description": "" },
    { "label": "Pessimistic", "value": "Pessimistic", "description": "" }
  ],
  "scenarioDefaults": {
    "Optimistic": {
      "description": "sustainable architecture, flying electric vehicles, lots of green areas, integrated solar energy, buildings with vertical gardens, futuristic public transport, people riding bikes, clean and visible rivers, holographic lighting, biophilic design"
    },
    "Pessimistic": {
      "description": "polluted and dense atmosphere, buildings in ruins or abandoned, little vegetation, heavy traffic of old vehicles, excessive neon signs, visible overpopulation, surveillance structures, acid rain, obsolete and broken technology, evident social inequality"
    }
  },
  "promptSuggestions": {
    "Optimistic": [ "sustainable architecture", "flying electric vehicles", "lots of green areas", "integrated solar energy", "buildings with vertical gardens", "futuristic public transport", "people riding bikes", "clean and visible rivers", "holographic lighting", "biophilic design" ],
    "Pessimistic": [ "polluted and dense atmosphere", "buildings in ruins or abandoned", "little vegetation", "heavy traffic of old vehicles", "excessive neon signs", "visible overpopulation", "surveillance structures", "acid rain", "obsolete and broken technology", "evident social inequality" ]
  },
  "apiErrors": {
    "unsupportedFileType": "Unsupported file type: {{type}}. Please upload a PNG, JPG, or WEBP image.",
    "invalidApiKey": "Invalid API key. Please ensure it is configured correctly.",
    "quotaExceeded": "API quota exceeded. Please check your plan and billing details.",
    "badRequest": "Bad request. The provided image may be unsupported, corrupt, or the prompt may be too long.",
    "serviceUnavailable": "The AI service is temporarily unavailable. Please try again later.",
    "generationFailed": "No image was generated. The model may have refused the request due to safety policies.",
    "unknown": "An unknown error occurred. Please try again.",
    "apiKeyMissing": "API_KEY environment variable not set.",
    "invalidBase64": "Invalid base64 data provided."
  },
  "prompts": {
    "initialFuture": "Photorealistic re-imagination of this cityscape image from Curitiba, Brazil. Project it {{year}} years into the future, adopting a {{scenarioLabel}} perspective. Focus on architectural changes, technological integration, and environmental aspects. {{scenarioDescription}}. Please also incorporate these specific user-requested details: \"{{customPrompt}}\".",
    "initialPast": "Photorealistic re-imagination of this cityscape image from Curitiba, Brazil. Project it {{year}} years into the past, adopting a {{scenarioLabel}} perspective. Focus on architectural changes, technology of that era, and environmental aspects. {{scenarioDescription}}. Please also incorporate these specific user-requested details: \"{{customPrompt}}\".",
    "refineWithText": "This is a photorealistic, futuristic image of Curitiba, Brazil, in a {{scenarioLabel}} scenario. The original creation was guided by this description: \"{{customPrompt}}\". Generate a new version of this image that incorporates this specific modification: \"{{modificationPrompt}}\". It's crucial to maintain the established futuristic {{scenarioLabel}} aesthetic, focusing on architecture, technology, and environment.",
    "refineWithMask": "You are an expert photo editor. Use the second image as a mask on the first image. The white area of the mask indicates the region to be modified. Apply the following instruction ONLY to the masked region: \"{{prompt}}\". The rest of the image must remain unchanged. Return only the complete, edited image."
  }
};

const translationPTBR = {
  "app": {
    "title": "Hipervisor - Curitiba do Amanhã"
  },
  "header": {
    "title": "Hipervisor <1>Curitiba do Amanhã</1>",
    "subtitle": "Suba sua própria imagem para ver Curitiba re-imaginada por IA"
  },
  "footer": {
    "text": "Desenvolvido por Hipervisor / IPPUC. Uma exploração da criatividade baseada em IA."
  },
  "settings": {
    "title": "Configurações do Aplicativo",
    "imageGeneration": {
      "title": "Geração de Imagem",
      "label": "Número de imagens geradas por vez",
      "description": "Escolha quantas variações de imagem serão criadas a cada clique em \"Re-imagine O Futuro\"."
    },
    "devMode": {
      "title": "Modo de Desenvolvedor",
      "label": "Modo DEV",
      "description": "Quando ativado, o aplicativo gera imagens de teste localmente sem usar a API Gemini.",
      "on": "Ativado",
      "off": "Desativado"
    },
    "language": {
      "title": "Idioma",
      "description": "Selecione o idioma da interface. Os prompts enviados à IA usarão o idioma selecionado.",
      "pt-BR": "Português (BR)",
      "en": "English (USA)"
    },
    "scenarioDefaults": {
      "title": "Padrões de Cenário",
      "label": "Preencher descrições de cenário padrão",
      "description": "Quando ativado, os cenários 'Otimista' e 'Pessimista' iniciarão com uma descrição preenchida baseada em temas comuns. Desative se preferir começar com uma tela em branco.",
      "on": "Ativado",
      "off": "Desativado"
    },
    "timeTravel": {
      "title": "Viagem no Tempo",
      "directionLabel": "Direção",
      "future": "Futuro",
      "past": "Passado",
      "yearsLabel": "Anos para viajar",
      "description": "Escolha ver a cidade no futuro ou no passado, e quantos anos viajar."
    },
    "buttons": {
      "save": "Salvar Configurações",
      "cancel": "Cancelar",
      "reset": "Resetar Padrões"
    }
  },
  "scenarioForm": {
    "title": "Customizar Cenários",
    "scenarioLabel": "Texto do botão",
    "scenarioDescription": "Descrição do Prompt IA",
    "remove": "Remover",
    "add": "+ Adicionar novo cenário",
    "save": "Salvar mudanças",
    "cancel": "Cancelar",
    "scenario": "Cenário",
    "removeAria": "Remover cenário {{label}}",
    "labelPlaceholder": "Ex: Solar Punk",
    "descriptionPlaceholder": "Descreva a estética desejada para a IA...",
    "newScenarioLabel": "Novo Cenário",
    "newScenarioDescription": "Uma descrição customizada para o novo cenário."
  },
  "imageGenerator": {
    "uploadTitle": "1. Suba a imagem",
    "scenarioTitle": "2. Escolha um cenário",
    "resultTitle": "3. Veja o Resultado",
    "manageScenarios": "Cenários",
    "settings": "Configurações",
    "customPromptLabel": "Prompt Customizado (opcional)",
    "customPromptPlaceholder": "Ex: com muitos pedestres nas calçadas, muitos carros nas vias...",
    "promptSuggestions": "Sugestões de Prompt",
    "newSuggestions": "Novas sugestões",
    "generateButton": "Re-imagine O Futuro",
    "generatingButton": "Gerando o Futuro...",
    "promptError": "Adicione uma descrição ao cenário ou um prompt customizado para continuar.",
    "uploadError": "Por favor, suba uma imagem primeiro.",
    "refineTitle": "4. Refine o Resultado",
    "editWithMask": "Editar com Máscara (Beta)",
    "or": "OU",
    "refinePlaceholder": "Ex: adicione mais pessoas, remova árvores...",
    "refineButton": "Gerar Variação (Texto)",
    "refiningButton": "Refinando...",
    "refineError": "Por favor, descreva as mudanças que você quer fazer.",
    "refineSelectionError": "Uma imagem precisa ser gerada e selecionada para criar uma variação.",
    "tabResult": "Resultado",
    "tabHistory": "Histórico",
    "clearPrompt": "Limpar prompt",
    "undoPrompt": "Desfazer alteração no prompt",
    "redoPrompt": "Refazer alteração no prompt"
  },
  "imageUploader": {
    "title": "1. Suba uma imagem",
    "dragAndDrop": "<0>Clique para enviar</0> ou arraste pra cá",
    "fileTypes": "PNG, JPG ou WEBP",
    "uploadedImageAlt": "Imagem enviada",
    "changeImage": "Trocar Imagem",
    "fullscreenTitle": "Visualização da imagem original"
  },
  "imageDisplay": {
    "subtitle": "{{timeTravelPrefix}}: {{timeLabel}} {{yearsLabel}} ({{scenarioLabel}}) - Variação {{selectedIndex}}/{{total}}",
    "timeTravelPrefix": "Viagem no Tempo",
    "yearsLabel_one": "Ano",
    "yearsLabel_other": "Anos",
    "placeholder": "Sua imagem gerada aparecerá aqui",
    "variation": "Variação {{index}}",
    "undo": "Desfazer",
    "redo": "Refazer",
    "refine": "Refinar imagem",
    "fullscreen": "Tela cheia",
    "download": "Download",
    "downloadAll": "Baixar Todas",
    "compare": "Comparar com original",
    "close": "Fechar tela cheia",
    "fullscreenTitle": "Visualização de imagem em tela cheia",
    "prev": "Imagem anterior",
    "next": "Próxima imagem",
    "originalLabel": "Original",
    "generatedLabel": "Gerado",
    "zipError": "Não foi possível baixar todas as imagens. Biblioteca JSZip não encontrada.",
    "zipCreateError": "Falha ao criar o arquivo zip. Veja o console para detalhes."
  },
  "history": {
    "title": "Histórico de Gerações",
    "clear": "Limpar Histórico",
    "placeholder": "O histórico de suas gerações aparecerá aqui.",
    "restore": "Restaurar",
    "revertError": "Não foi possível restaurar o histórico (snapshot não encontrado).",
    "entry": {
      "initial": "Geração Inicial",
      "refinement": "Refinamento por Texto",
      "mask_edit": "Edição Mágica",
      "default": "Geração"
    },
    "timeAgo": {
      "now": "agora",
      "seconds_one": "há {{count}} segundo",
      "seconds_other": "há {{count}} segundos",
      "minutes_one": "há {{count}} minuto",
      "minutes_other": "há {{count}} minutos",
      "hours_one": "há {{count}} hora",
      "hours_other": "há {{count}} horas",
      "days_one": "há {{count}} dia",
      "days_other": "há {{count}} dias",
      "months_one": "há {{count}} mês",
      "months_other": "há {{count}} meses",
      "years_one": "há {{count}} ano",
      "years_other": "há {{count}} anos"
    }
  },
  "maskEditor": {
    "title": "Edição Mágica",
    "promptPlaceholder": "Descreva o que você quer mudar na area marcada...",
    "generate": "Gerar",
    "generating": "Gerando...",
    "brushSize": "Tamanho do Pincel",
    "undo": "Desfazer",
    "clear": "Limpar máscara"
  },
  "scenarios": [
    { "label": "Otimista", "value": "Otimista", "description": "" },
    { "label": "Pessimista", "value": "Pessimista", "description": "" }
  ],
  "scenarioDefaults": {
    "Otimista": {
      "description": "arquitetura sustentável, veículos elétricos voadores, muitas áreas verdes, energia solar integrada, prédios com jardins verticais, transporte público futurista, pessoas andando de bicicleta, rios limpos e visíveis, iluminação holográfica, design biofílico"
    },
    "Pessimista": {
      "description": "atmosfera poluída e densa, prédios em ruínas ou abandonados, pouca vegetação, tráfego intenso de veículos antigos, outdoors de neon excessivos, superpopulação visível, estruturas de vigilância, chuva ácida, tecnologia obsoleta e quebrada, desigualdade social evidente"
    }
  },
  "promptSuggestions": {
    "Otimista": [ "arquitetura sustentável", "veículos elétricos voadores", "muitas áreas verdes", "energia solar integrada", "prédios com jardins verticais", "transporte público futurista", "pessoas andando de bicicleta", "rios limpos e visíveis", "iluminação holográfica", "design biofílico" ],
    "Pessimista": [ "atmosfera poluída e densa", "prédios em ruínas ou abandonados", "pouca vegetação", "tráfego intenso de veículos antigos", "outdoors de neon excessivos", "superpopulação visível", "estruturas de vigilância", "chuva ácida", "tecnologia obsoleta e quebrada", "desigualdade social evidente" ]
  },
  "apiErrors": {
    "unsupportedFileType": "Tipo de arquivo não suportado: {{type}}. Por favor, envie uma imagem PNG, JPG ou WEBP.",
    "invalidApiKey": "Chave de API inválida. Certifique-se de que ela esteja configurada corretamente.",
    "quotaExceeded": "Cota de API excedida. Por favor verifique seu plano e detalhes de cobrança.",
    "badRequest": "Requisição inválida. A imagem enviada pode estar em formato não suportado, quebrada ou o prompt pode ser muito longo.",
    "serviceUnavailable": "O serviço de IA está temporariamente indisponível. Por favor tente novamente mais tarde.",
    "generationFailed": "Nenhuma imagem foi gerada. O modelo pode ter recusado a solicitação devido a políticas de segurança.",
    "unknown": "Ocorreu um erro desconhecido. Por favor tente novamente.",
    "apiKeyMissing": "Variável de ambiente API_KEY não configurada.",
    "invalidBase64": "Dados base64 inválidos fornecidos."
  },
  "prompts": {
    "initialFuture": "Recriação fotorrealista desta imagem de paisagem urbana de Curitiba, Brasil. Projete-a {{year}} anos no futuro, adotando uma perspectiva {{scenarioLabel}}. Foco em mudanças arquitetônicas, integração tecnológica e aspectos ambientais. {{scenarioDescription}}. Por favor, incorpore também estes detalhes específicos solicitados pelo usuário: \"{{customPrompt}}\".",
    "initialPast": "Recriação fotorrealista desta imagem de paisagem urbana de Curitiba, Brasil. Projete-a {{year}} anos no passado, adotando uma perspectiva {{scenarioLabel}}. Foco em mudanças arquitetônicas, tecnologia daquela época e aspectos ambientais. {{scenarioDescription}}. Por favor, incorpore também estes detalhes específicos solicitados pelo usuário: \"{{customPrompt}}\".",
    "refineWithText": "Esta é uma imagem fotorrealista e futurista de Curitiba, Brasil, em um cenário {{scenarioLabel}}. A criação original foi guiada por esta descrição: \"{{customPrompt}}\". Gere uma nova versão desta imagem que incorpore esta modificação específica: \"{{modificationPrompt}}\". É crucial manter a estética futurista {{scenarioLabel}} estabelecida, com foco em arquitetura, tecnologia e meio ambiente.",
    "refineWithMask": "Você é um editor de fotos especialista. Use a segunda imagem como uma máscara na primeira imagem. A área branca da máscara indica a região a ser modificada. Aplique a seguinte instrução SOMENTE à região mascarada: \"{{prompt}}\". O restante da imagem deve permanecer inalterado. Retorne apenas a imagem completa e editada."
  }
};

const resources = {
  en: {
    translation: translationEN,
  },
  'pt-BR': {
    translation: translationPTBR,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    debug: false,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
