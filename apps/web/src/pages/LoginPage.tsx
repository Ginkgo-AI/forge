import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client.ts";
import { Loader2 } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const { error: err } = await authClient.signUp.email({
          name,
          email,
          password,
        });
        if (err) {
          setError(err.message ?? "Registration failed");
          setLoading(false);
          return;
        }
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
        });
        if (err) {
          setError(err.message ?? "Login failed");
          setLoading(false);
          return;
        }
      }
      navigate("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-forge-bg px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-forge-accent">Forge</h1>
          <p className="text-forge-text-muted mt-1 text-sm">
            AI-Powered Work Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-forge-surface border border-forge-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-forge-text mb-4">
            {isRegister ? "Create an account" : "Welcome back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm text-forge-text-muted mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-md bg-forge-bg border border-forge-border text-forge-text text-sm placeholder:text-forge-text-muted focus:outline-none focus:ring-2 focus:ring-forge-accent/50 focus:border-forge-accent"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-forge-text-muted mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md bg-forge-bg border border-forge-border text-forge-text text-sm placeholder:text-forge-text-muted focus:outline-none focus:ring-2 focus:ring-forge-accent/50 focus:border-forge-accent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-forge-text-muted mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-md bg-forge-bg border border-forge-border text-forge-text text-sm placeholder:text-forge-text-muted focus:outline-none focus:ring-2 focus:ring-forge-accent/50 focus:border-forge-accent"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-forge-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-forge-accent hover:bg-forge-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-forge-text-muted">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-forge-accent hover:text-forge-accent-hover"
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
