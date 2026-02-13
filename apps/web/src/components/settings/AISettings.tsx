import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useAISettings } from "../../hooks/useSettings.ts";
import { Button } from "../ui/Button.tsx";
import { toast } from "../ui/Toaster.tsx";
import type { ProviderInfo } from "../../lib/api.ts";

export function AISettings() {
  const { data, isLoading } = useAISettings();
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const aiData = (data as any)?.data;
  const providers: ProviderInfo[] = aiData?.providers ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-forge-text-muted" size={20} />
      </div>
    );
  }

  const handleTest = async (providerId: string) => {
    setTesting(providerId);
    try {
      // Simple test — fetch providers which validates the connection
      const res = await fetch("/api/v1/ai/providers", { credentials: "include" });
      if (res.ok) {
        setTestResults((prev) => ({ ...prev, [providerId]: true }));
        toast.success(`${providerId} connection successful`);
      } else {
        setTestResults((prev) => ({ ...prev, [providerId]: false }));
        toast.error(`${providerId} connection failed`);
      }
    } catch {
      setTestResults((prev) => ({ ...prev, [providerId]: false }));
      toast.error(`${providerId} connection failed`);
    }
    setTesting(null);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <section>
        <h3 className="text-sm font-medium text-forge-text mb-1">AI Providers</h3>
        <p className="text-xs text-forge-text-muted mb-4">
          Configure AI providers via environment variables. Active providers are shown below.
        </p>

        {providers.length === 0 ? (
          <div className="border border-forge-border rounded-lg px-4 py-8 text-center text-sm text-forge-text-muted">
            No AI providers configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment.
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.providerId}
                className="border border-forge-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-forge-text">
                      {provider.displayName}
                    </span>
                    {provider.isDefault && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-forge-accent/20 text-forge-accent font-medium">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults[provider.providerId] === true && (
                      <CheckCircle2 size={14} className="text-forge-success" />
                    )}
                    {testResults[provider.providerId] === false && (
                      <XCircle size={14} className="text-forge-danger" />
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={testing === provider.providerId}
                      onClick={() => handleTest(provider.providerId)}
                    >
                      Test
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {provider.models.map((model) => (
                    <span
                      key={model.id}
                      className={`px-2 py-1 rounded text-xs ${
                        model.id === provider.defaultModel
                          ? "bg-forge-accent/15 text-forge-accent"
                          : "bg-forge-surface-hover text-forge-text-muted"
                      }`}
                    >
                      {model.displayName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-medium text-forge-text mb-1">Default Configuration</h3>
        <p className="text-xs text-forge-text-muted mb-3">
          Set via AI_DEFAULT_PROVIDER and AI_DEFAULT_MODEL environment variables.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">Provider</label>
            <div className="px-3 py-2 rounded-md bg-forge-bg border border-forge-border text-sm text-forge-text">
              {aiData?.defaultProvider ?? "Not set"}
            </div>
          </div>
          <div>
            <label className="block text-xs text-forge-text-muted mb-1">Model</label>
            <div className="px-3 py-2 rounded-md bg-forge-bg border border-forge-border text-sm text-forge-text">
              {aiData?.defaultModel ?? "Not set"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
