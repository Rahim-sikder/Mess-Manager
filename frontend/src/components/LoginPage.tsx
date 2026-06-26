import { useState, type FormEvent } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

type Mode = "signin" | "signup";

function friendlyError(error: AuthError | Error): string {
  const msg = error.message.toLowerCase();
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (msg.includes("already exists") || msg.includes("already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please verify your email before signing in.";
  }
  if (msg.includes("password should be") || msg.includes("password must")) {
    return "Password must be at least 6 characters.";
  }
  if (msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error — check your connection and try again.";
  }
  // Pass through our own custom messages unchanged
  if (error.message.length < 120) return error.message;
  return "Something went wrong. Please try again.";
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode]         = useState<Mode>("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
    setConfirm("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        // AuthContext will update user → App re-renders the shell automatically
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setSuccess(
            "Account created! Check your email for a confirmation link, then sign in."
          );
          switchMode("signin");
        }
        // If no confirmation needed, AuthContext fires onAuthStateChange → user set automatically
      }
    } catch (err) {
      setError(friendlyError(err as AuthError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white text-xl font-bold mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold text-white">Mess Manager</h1>
          <p className="mt-1 text-sm text-gray-400">
            {mode === "signin" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] shadow-sm overflow-hidden">

          {/* Mode toggle tabs */}
          <div className="grid grid-cols-2 border-b border-[#2A2A2A]">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`py-3 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-[#181818] text-red-400 border-b-2 border-red-600"
                    : "bg-[#111111] text-gray-500 hover:text-gray-300"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>

            {success && (
              <div className="rounded-lg border border-green-800 bg-green-950/50 px-4 py-3 text-sm text-green-400">
                {success}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              disabled={loading}
              hint={mode === "signup" ? "At least 6 characters" : undefined}
            />

            {mode === "signup" && (
              <Input
                label="Confirm password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                disabled={loading}
                error={confirm && password !== confirm ? "Passwords do not match" : undefined}
              />
            )}

            {error && (
              <div role="alert" className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full justify-center py-2.5 mt-2"
            >
              {loading
                ? mode === "signin" ? "Signing in…" : "Creating account…"
                : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
