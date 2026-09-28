import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, MountainSnow } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links: { to: string; label: string }[] = [
    { to: "/stays", label: "Explore stays" },
    ...(user && role === "host" ? [{ to: "/host", label: "Host dashboard" }] : []),
    ...(user && role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
    ...(user ? [{ to: "/bookings", label: "My trips" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MountainSnow className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">StayLocal</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <Button
              variant="outline"
              className="ml-2 rounded-full"
              onClick={async () => {
                await signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              Sign out
            </Button>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "signup", role: "host" }} className="ml-2">
                <Button variant="ghost" className="rounded-full">
                  Become a host
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signin", role: "tourist" }}>
                <Button className="rounded-full">Sign in</Button>
              </Link>
            </>
          )}
        </nav>

        <button
          className="ml-auto inline-flex size-10 items-center justify-center rounded-xl border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button
                variant="outline"
                className="mt-2 rounded-full"
                onClick={async () => {
                  setOpen(false);
                  await signOut();
                  navigate({ to: "/", replace: true });
                }}
              >
                Sign out
              </Button>
            ) : (
              <Link to="/auth" search={{ mode: "signin", role: "tourist" }} onClick={() => setOpen(false)}>
                <Button className="mt-2 w-full rounded-full">Sign in / Register</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
