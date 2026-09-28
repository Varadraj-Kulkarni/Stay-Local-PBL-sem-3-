import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-semibold">StayLocal</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Stay with Locals, Pay Less, Experience More.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Explore</p>
          <div className="mt-2 flex flex-col gap-1 text-muted-foreground">
            <Link to="/stays">All stays</Link>
            <Link to="/stays" search={{ q: "Lonavala" }}>
              Lonavala
            </Link>
            <Link to="/stays" search={{ q: "Pune" }}>
              Pune
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Hosting</p>
          <div className="mt-2 flex flex-col gap-1 text-muted-foreground">
            <Link to="/auth" search={{ mode: "signup", role: "host" }}>
              Become a host
            </Link>
            <Link to="/host">Host dashboard</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        StayLocal is a student prototype. Listings and rewards shown here are for demonstration.
      </p>
    </footer>
  );
}
