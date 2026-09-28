import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { register, login } from "@/lib/api/auth";

type Mode = "signin" | "signup";
type RoleChoice = "tourist" | "host";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search['mode'] === "signup" ? "signup" : "signin") as Mode,
    role: (search['role'] === "host" ? "host" : "tourist") as RoleChoice,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or register — StayLocal" },
      { name: "description", content: "Create a StayLocal account as a tourist, local host or admin." },
      { property: "og:title", content: "Sign in or register — StayLocal" },
      { property: "og:description", content: "Join StayLocal to book local stays or host travellers." },
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

  const quickLogin = async (demoEmail: string) => {
    setBusy(true);
    try {
      const res = await login({ email: demoEmail, password: "DemoPass123!" });
      await refresh();
      toast.success(`Logged in as ${res.user.fullName} (${res.user.role})`);
      if (res.user.role === "HOST") navigate({ to: "/host" });
      else if (res.user.role === "ADMIN") navigate({ to: "/admin" });
      else navigate({ to: "/stays", search: { q: "" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quick login failed.");
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
        toast.success("Welcome back to StayLocal!");
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
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="surface-card p-7">
        <h1 className="font-display text-2xl font-semibold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stay with Locals, Pay Less, Experience More.
        </p>

        {/* Demo Persona Quick-Switcher */}
        <div className="mt-5 rounded-2xl bg-secondary/60 p-3.5 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Demo Evaluator Quick-Login:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => quickLogin("tourist@staylocal.demo")}
              className="rounded-lg bg-card border border-border px-2 py-1.5 text-xs font-medium hover:border-primary transition-colors text-center"
            >
              👤 Tourist
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => quickLogin("host@staylocal.demo")}
              className="rounded-lg bg-card border border-border px-2 py-1.5 text-xs font-medium hover:border-primary transition-colors text-center"
            >
              🏡 Host
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => quickLogin("admin@staylocal.demo")}
              className="rounded-lg bg-card border border-border px-2 py-1.5 text-xs font-medium hover:border-primary transition-colors text-center"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label>I am a</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["tourist", "host"] as RoleChoice[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`rounded-xl border px-2 py-2 text-sm font-medium capitalize transition-colors ${
                        role === r
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          className="mt-5 w-full text-sm text-muted-foreground underline"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
          }}
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
