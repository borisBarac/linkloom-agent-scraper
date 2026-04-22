import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { type ModelProvider, ScrapperError } from "../../types/internal";

type TextToVectorOptions = {
  provider: ModelProvider;
  apiKey?: string;
};

const EmbeddingModelProviderValues = {
  OPENAI: "text-embedding-3-small",
  GEMINI: "models/embedding-001",
} as const;

type EmbeddingModelProviderType = (typeof EmbeddingModelProviderValues)[keyof typeof EmbeddingModelProviderValues];

export const textToVector = async (text: string, options?: TextToVectorOptions): Promise<number[]> => {
  const provider: ModelProvider = options?.provider || "openai"; // Default to OpenAI if not specified
  const apiKey = options?.apiKey || (provider === "openai" ? Bun.env.OPENAI_API_KEY : Bun.env.GEMINI_API_KEY);

  let model: EmbeddingModelProviderType;

  switch (provider) {
    case "openai":
      model = EmbeddingModelProviderValues.OPENAI;
      break;
    case "gemini":
      model = EmbeddingModelProviderValues.GEMINI;
      break;
    default:
      model = EmbeddingModelProviderValues.OPENAI;
  }

  if (!apiKey) {
    throw new ScrapperError("LLM_MISSING_API_KEY", `API key for ${provider} is required`);
  }

  try {
    let embeddingsInstance: { embedQuery: (text: string) => Promise<number[]> };
    switch (provider) {
      case "openai":
        embeddingsInstance = new OpenAIEmbeddings({ model: model, apiKey });
        break;
      case "gemini":
        embeddingsInstance = new GoogleGenerativeAIEmbeddings({
          model: model,
          apiKey,
        });
        break;
      default:
        // This case should ideally not be reached due to the switch above,
        // but as a fallback, default to OpenAI.
        embeddingsInstance = new OpenAIEmbeddings({
          model: EmbeddingModelProviderValues.OPENAI,
          apiKey,
        });
    }

    return embeddingsInstance.embedQuery(text);
  } catch (error) {
    console.error(`Embedding failed: ${error instanceof Error ? error.message : error}`);
    throw new ScrapperError("LLM_EMBEDDING_ERROR", "Failed to generate vector representation");
  }
};
