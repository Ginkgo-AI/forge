import { useState, useEffect } from "react";
import { Loader2, Shield, Crown, User } from "lucide-react";
import { useWorkspaceStore } from "../../stores/workspace.ts";
import { useWorkspaceSettings, useUpdateWorkspaceSettings } from "../../hooks/useSettings.ts";
import { Button } from "../ui/Button.tsx";
import { Input } from "../ui/Input.tsx";
import { toast } from "../ui/Toaster.tsx";

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown size={12} className="text-forge-warning" />,
  admin: <Shield size={12} className="text-forge-accent" />,
  member: <User size={12} className="text-forge-text-muted" />,
  viewer: <User size={12} className="text-forge-text-muted" />,
};

export function WorkspaceSettings() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { data, isLoading } = useWorkspaceSettings(workspace?.id);
  const updateSettings = useUpdateWorkspaceSettings(workspace?.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const ws = (data as any)?.data;

  useEffect(() => {
    if (ws) {
      setName(ws.name ?? "");
      setDescription(ws.description ?? "");
    }
  }, [ws]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-forge-text-muted" size={20} />
      </div>
    );
  }

  const handleSave = () => {
    updateSettings.mutate(
      { name, description },
      {
        onSuccess: () => toast.success("Workspace updated"),
        onError: () => toast.error("Failed to update workspace"),
      }
    );
  };

  return (
    <div className="space-y-8 max-w-xl">
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-forge-text">General</h3>
        <Input
          label="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <label className="block text-sm text-forge-text-muted mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-md bg-forge-bg border border-forge-border text-forge-text text-sm placeholder:text-forge-text-muted focus:outline-none focus:ring-2 focus:ring-forge-accent/50 focus:border-forge-accent resize-none"
          />
        </div>
        <Button onClick={handleSave} loading={updateSettings.isPending}>
          Save changes
        </Button>
      </section>

      {/* Members */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-forge-text">Members</h3>
        <div className="border border-forge-border rounded-lg divide-y divide-forge-border">
          {(ws?.members ?? []).map((member: any) => (
            <div key={member.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-forge-accent/20 flex items-center justify-center text-xs font-medium text-forge-accent">
                  {member.user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm text-forge-text">{member.user?.name}</p>
                  <p className="text-xs text-forge-text-muted">{member.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-forge-surface-hover text-xs text-forge-text-muted">
                {roleIcons[member.role] ?? null}
                {member.role}
              </div>
            </div>
          ))}
          {(!ws?.members || ws.members.length === 0) && (
            <div className="px-4 py-6 text-sm text-forge-text-muted text-center">
              No members found
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
