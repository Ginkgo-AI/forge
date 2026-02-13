import { create } from "zustand";

type AIPreferences = {
  preferredProviderId: string | null;
  preferredModelId: string | null;
  setPreferredModel: (providerId: string, modelId: string) => void;
  clearPreference: () => void;
};

const STORAGE_KEY = "forge-ai-preferences";

function load(): { providerId: string | null; modelId: string | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { providerId: parsed.providerId ?? null, modelId: parsed.modelId ?? null };
    }
  } catch {}
  return { providerId: null, modelId: null };
}

function save(providerId: string | null, modelId: string | null) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ providerId, modelId }));
}

export const useAIPreferencesStore = create<AIPreferences>((set) => {
  const initial = load();
  return {
    preferredProviderId: initial.providerId,
    preferredModelId: initial.modelId,

    setPreferredModel: (providerId, modelId) => {
      save(providerId, modelId);
      set({ preferredProviderId: providerId, preferredModelId: modelId });
    },

    clearPreference: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({ preferredProviderId: null, preferredModelId: null });
    },
  };
});
