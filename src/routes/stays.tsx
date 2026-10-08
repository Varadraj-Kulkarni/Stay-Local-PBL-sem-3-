import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCard } from "@/components/property-card";
import { DESTINATIONS, normalizeProperty, rupees, type Property } from "@/lib/staylocal";
import { getProperties } from "@/lib/api/properties";

export const Route = createFileRoute("/stays")({
  validateSearch: (search: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse local stays — StayLocal" },
      {
        name: "description",
        content: "Search affordable rooms in local homes across Bhimashankar, Visapur Fort, Lonavala and Pune.",
      },
      { property: "og:title", content: "Browse local stays — StayLocal" },
      { property: "og:description", content: "Filter local homes by destination and price." },
    ],
  }),
  component: StaysPage,
});

function StaysPage() {
  const q = Route.useSearch().q ?? "";
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const [maxPrice, setMaxPrice] = useState(3000);

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["stays", q, maxPrice],
    queryFn: async () => {
      const res = await getProperties({
        search: q || undefined,
        maxPrice: maxPrice || undefined,
      });
      return res.items.map(normalizeProperty);
    },
  });

  const results = all.filter(
    (p) =>
      p.price_per_night <= maxPrice &&
      (q.trim() === "" ||
        p.location.toLowerCase().includes(q.trim().toLowerCase()) ||
        p.name.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Find a local stay</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isLoading ? "Loading stays…" : `${results.length} home${results.length === 1 ? "" : "s"} available`}
      </p>

      <form
        className="mt-6 flex flex-col gap-3 rounded-xl border border-border/70 bg-card/85 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/stays", search: { q: term } });
        }}
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by destination or homestay name..."
          className="h-11 flex-1 bg-background"
        />
        <div className="flex items-center gap-3 px-2">
          <label className="text-sm whitespace-nowrap text-muted-foreground font-medium">
            Max {rupees(maxPrice)}
          </label>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-32 accent-[var(--primary)] cursor-pointer"
          />
        </div>
        <Button type="submit" className="h-11 rounded-lg px-6 font-medium shadow-xs">
          <Search className="size-4" /> Filter
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setTerm("");
            navigate({ to: "/stays", search: { q: "" } });
          }}
          className={`rounded-md border px-4 py-1.5 text-sm ${q === "" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
        >
          All
        </button>
        {DESTINATIONS.map((d) => (
          <button
            key={d.name}
            onClick={() => {
              setTerm(d.name);
              navigate({ to: "/stays", search: { q: d.name } });
            }}
            className={`rounded-md border px-4 py-1.5 text-sm ${q === d.name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>

      {!isLoading && results.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">
          No stays match that search yet. Try another destination or raise the price limit.
        </p>
      )}
    </div>
  );
}
