import { useState } from "react";
import { Building2, Brain, UserCircle, Bell } from "lucide-react";
import { WorkspaceSettings } from "../components/settings/WorkspaceSettings.tsx";
import { AISettings } from "../components/settings/AISettings.tsx";
import { ProfileSettings } from "../components/settings/ProfileSettings.tsx";
import { NotificationSettings } from "../components/settings/NotificationSettings.tsx";

const tabs = [
  { id: "workspace", label: "Workspace", icon: Building2, component: WorkspaceSettings },
  { id: "ai", label: "AI Configuration", icon: Brain, component: AISettings },
  { id: "profile", label: "Profile", icon: UserCircle, component: ProfileSettings },
  { id: "notifications", label: "Notifications", icon: Bell, component: NotificationSettings },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("workspace");
  const ActiveComponent = tabs.find((t) => t.id === activeTab)!.component;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Settings</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Tab nav */}
        <nav className="flex sm:flex-col gap-1 sm:w-48 shrink-0 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-forge-accent/15 text-forge-accent"
                    : "text-forge-text-muted hover:bg-forge-surface-hover hover:text-forge-text"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
