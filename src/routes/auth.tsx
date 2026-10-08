import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { User, Home as HomeIcon, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { register, login } from "@/lib/api/auth";

type Mode = "signin" | "signup";
type RoleChoice = "tourist" | "host";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search["mode"] === "signup" ? "signup" : "signin") as Mode,
    role: (search["role"] === "host" ? "host" : "tourist") as RoleChoice,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or register — StayLocal" },
      { name: "description", content: "Create a StayLocal account as a traveller or local host." },
      { property: "og:title", content: "Sign in or register — StayLocal" },
      { property: "og:description", content: "Join StayLocal to book authentic local stays or host travellers." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>(search.mode);
  const [role, setRole] = useState<RoleChoice>(search.role);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const quickLogin = async (loginEmail: string, roleName: string) => {
    setBusy(true);
    try {
      const res = await login({ email: loginEmail, password: "DemoPass123!" });
      await refresh();
      toast.success(`Welcome back, ${res.user.fullName}!`);
      if (res.user.role === "HOST") navigate({ to: "/host" });
      else if (res.user.role === "ADMIN") navigate({ to: "/admin" });
      else navigate({ to: "/stays", search: { q: "" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Login as ${roleName} failed.`);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role: role === "host" ? "HOST" : "TOURIST",
        });
        await refresh();
        toast.success("Account created successfully!");
        if (res.user.role === "HOST") navigate({ to: "/host" });
        else navigate({ to: "/stays", search: { q: "" } });
      } else {
        const res = await login({
          email: email.trim(),
          password,
        });
        await refresh();
        toast.success(`Welcome back, ${res.user.fullName}!`);
        if (res.user.role === "HOST") navigate({ to: "/host" });
        else if (res.user.role === "ADMIN") navigate({ to: "/admin" });
        else navigate({ to: "/stays", search: { q: "" } });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-68px)] flex items-center justify-center p-4 py-12 overflow-hidden">
      {/* Background scenic photo with layered blur effects */}
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/hero.jpg"
          alt="Scenic Sahyadri Mountains"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/75 to-background/60" />
      </div>

      {/* Decorative ambient color spots */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[400px] bg-primary/20 blur-[110px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md">
        {/* Glassmorphic Auth Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/40 shadow-xl backdrop-blur-xl bg-card/90">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="size-3.5" /> Authentic Homestays
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {mode === "signup" ? "Join StayLocal" : "Welcome Back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup"
                ? "Experience the real culture by staying directly with verified hosts."
                : "Sign in to access your bookings, trips, and saved stays."}
            </p>
          </div>

          {/* Quick Sign-in Shortcuts */}
          <div className="mt-6 rounded-xl bg-secondary/50 border border-border/80 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Instant Account Access
              </span>
              <span className="text-[11px] text-primary/90 font-medium">One-click sign in</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => quickLogin("tourist@staylocal.demo", "Traveller")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg bg-card/90 border border-border/60 py-2 px-1 text-xs font-medium hover:border-primary hover:bg-primary/5 transition-all text-foreground active:scale-95 shadow-xs"
              >
                <User className="size-3.5 text-primary" />
                <span>Traveller</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => quickLogin("host@staylocal.demo", "Local Host")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg bg-card/90 border border-border/60 py-2 px-1 text-xs font-medium hover:border-primary hover:bg-primary/5 transition-all text-foreground active:scale-95 shadow-xs"
              >
                <HomeIcon className="size-3.5 text-primary" />
                <span>Local Host</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => quickLogin("admin@staylocal.demo", "Admin")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg bg-card/90 border border-border/60 py-2 px-1 text-xs font-medium hover:border-primary hover:bg-primary/5 transition-all text-foreground active:scale-95 shadow-xs"
              >
                <Shield className="size-3.5 text-primary" />
                <span>Platform Admin</span>
              </button>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    maxLength={80}
                    placeholder="e.g. Rahul Deshmukh"
                    className="bg-background/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">I want to</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("tourist")}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        role === "tourist"
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border bg-background/60 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <User className="size-3.5" /> Book Stays (Tourist)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("host")}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                        role === "host"
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border bg-background/60 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <HomeIcon className="size-3.5" /> Host Travellers
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                placeholder="you@example.com"
                className="bg-background/80"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                {mode === "signin" && (
                  <span className="text-[11px] text-muted-foreground">Default: DemoPass123!</span>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="bg-background/80"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl py-2.5 font-medium shadow-sm transition-all" disabled={busy}>
              {busy ? "Authenticating…" : mode === "signup" ? "Create Free Account" : "Sign In to Account"}
            </Button>
          </form>

          {/* Toggle Signin / Signup */}
          <div className="mt-6 text-center pt-4 border-t border-border/60">
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
              }}
            >
              {mode === "signup" ? (
                <span>Already have an account? <strong className="text-primary underline">Sign in</strong></span>
              ) : (
                <span>Don't have an account yet? <strong className="text-primary underline">Create an account</strong></span>
              )}
            </button>
          </div>
        </div>

        {/* Feature badges under card */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground/80">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 text-primary" /> Verified Homestays
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 text-primary" /> Instant GPS Check
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 text-primary" /> ₹100 Reward Coupons
          </span>
        </div>
      </div>
    </div>
  );
}
