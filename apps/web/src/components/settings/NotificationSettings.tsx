import { useState, useEffect } from "react";
import { toast } from "../ui/Toaster.tsx";
import { Button } from "../ui/Button.tsx";

type Prefs = {
  agentCompletion: boolean;
  automationFailures: boolean;
  mentions: boolean;
};

const STORAGE_KEY = "forge_notification_prefs";

function loadPrefs(): Prefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { agentCompletion: true, automationFailures: true, mentions: true };
}

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggles: { key: keyof Prefs; label: string; description: string }[] = [
    {
      key: "agentCompletion",
      label: "Agent completions",
      description: "Notify when an AI agent finishes a run",
    },
    {
      key: "automationFailures",
      label: "Automation failures",
      description: "Notify when an automation fails to execute",
    },
    {
      key: "mentions",
      label: "Mentions",
      description: "Notify when someone mentions you in a comment",
    },
  ];

  return (
    <div className="space-y-6 max-w-xl">
      <section>
        <h3 className="text-sm font-medium text-forge-text mb-1">Email Notifications</h3>
        <p className="text-xs text-forge-text-muted mb-4">
          Choose which events you want to be notified about. Email delivery will be available in a future update.
        </p>
        <div className="space-y-3">
          {toggles.map(({ key, label, description }) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 border border-forge-border rounded-lg cursor-pointer hover:bg-forge-surface-hover/50 transition-colors"
            >
              <div>
                <p className="text-sm text-forge-text">{label}</p>
                <p className="text-xs text-forge-text-muted">{description}</p>
              </div>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  setPrefs((p) => ({ ...p, [key]: !p[key] }));
                }}
                className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                  prefs[key] ? "bg-forge-accent" : "bg-forge-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs[key] ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </label>
          ))}
        </div>
      </section>
      <Button
        variant="secondary"
        onClick={() => toast.info("Preferences saved locally")}
      >
        Save preferences
      </Button>
    </div>
  );
}
