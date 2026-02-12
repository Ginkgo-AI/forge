import type { AIProvider, ProviderInfo, ProviderModel } from "./types.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { OpenAICompatProvider } from "./providers/openai-compat.js";

const providers = new Map<string, AIProvider>();
let defaultProviderId: string | undefined;
let defaultModelId: string | undefined;

export function initProviders() {
  providers.clear();

  // Anthropic — available if ANTHROPIC_API_KEY is set
  if (process.env.ANTHROPIC_API_KEY) {
    const provider = new AnthropicProvider();
    providers.set(provider.providerId, provider);
  }

  // OpenAI-compatible — available if OPENAI_API_KEY is set
  if (process.env.OPENAI_API_KEY) {
    const modelIds = (process.env.OPENAI_MODELS || "gpt-4o,gpt-4o-mini")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const models: ProviderModel[] = modelIds.map((id) => ({
      id,
      displayName: id,
      maxTokens: 4096,
    }));

    const provider = new OpenAICompatProvider({
      providerName: process.env.OPENAI_PROVIDER_NAME || "OpenAI",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
      models,
    });
    providers.set(provider.providerId, provider);
  }

  // Set defaults from env
  defaultProviderId = process.env.AI_DEFAULT_PROVIDER;
  defaultModelId = process.env.AI_DEFAULT_MODEL;

  // Fallback: use the first available provider
  if (!defaultProviderId || !providers.has(defaultProviderId)) {
    defaultProviderId = providers.keys().next().value;
  }
}

export function getProvider(providerId?: string): AIProvider {
  const id = providerId || defaultProviderId;
  if (!id) {
    throw new Error("No AI providers configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
  }
  const provider = providers.get(id);
  if (!provider) {
    throw new Error(
      `AI provider "${id}" not available. Available: ${[...providers.keys()].join(", ")}`
    );
  }
  return provider;
}

export function getDefaultModel(providerId?: string): string {
  if (!providerId && defaultModelId) {
    return defaultModelId;
  }
  const provider = getProvider(providerId);
  return provider.defaultModel;
}

export function getAvailableProviders(): ProviderInfo[] {
  return [...providers.values()].map((p) => ({
    providerId: p.providerId,
    displayName: p.displayName,
    models: p.models,
    defaultModel: p.defaultModel,
    isDefault: p.providerId === defaultProviderId,
  }));
}

// Initialize on import
initProviders();
