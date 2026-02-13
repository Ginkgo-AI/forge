import { useState, useEffect } from "react";
import { useWorkspaceStore } from "../../stores/workspace.ts";
import { useUpdateProfile, useChangePassword } from "../../hooks/useSettings.ts";
import { Button } from "../ui/Button.tsx";
import { Input } from "../ui/Input.tsx";
import { toast } from "../ui/Toaster.tsx";

export function ProfileSettings() {
  const currentUser = useWorkspaceStore((s) => s.currentUser);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name ?? "");
      setAvatarUrl(currentUser.avatarUrl ?? "");
    }
  }, [currentUser]);

  const handleSaveProfile = () => {
    updateProfile.mutate(
      { name, avatarUrl: avatarUrl || null },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Password changed");
          setCurrentPassword("");
          setNewPassword("");
        },
        onError: () => toast.error("Failed to change password. Check your current password."),
      }
    );
  };

  return (
    <div className="space-y-8 max-w-xl">
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-forge-text">Profile</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-forge-accent/20 flex items-center justify-center text-lg font-semibold text-forge-accent">
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-medium text-forge-text">{currentUser?.name}</p>
            <p className="text-xs text-forge-text-muted">{currentUser?.email}</p>
          </div>
        </div>
        <Input
          label="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Avatar URL"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/avatar.png"
        />
        <Button onClick={handleSaveProfile} loading={updateProfile.isPending}>
          Save profile
        </Button>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-forge-text">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Min. 8 characters"
          />
          <Button type="submit" loading={changePassword.isPending}>
            Change password
          </Button>
        </form>
      </section>
    </div>
  );
}
