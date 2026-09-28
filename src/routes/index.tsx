import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Gift, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCard } from "@/components/property-card";
import { DESTINATIONS, EXPERIENCES, normalizeProperty, type Property } from "@/lib/staylocal";
import { getProperties } from "@/lib/api/properties";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StayLocal — Stay with Locals. Pay Less. Experience More." },
      {
        name: "description",
        content:
          "Discover affordable local stays in Bhimashankar, Visapur Fort, Lonavala and Pune, and experience every destination like a local.",
      },
      { property: "og:title", content: "StayLocal — Stay with Locals. Pay Less. Experience More." },
      {
        property: "og:description",
        content: "Affordable rooms with verified local hosts, plus authentic local experiences.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  { n: 1, title: "Find a stay", text: "Search a destination and compare local homes by price." },
  { n: 2, title: "Choose a local host", text: "Read reviews and check the host's verification." },
  { n: 3, title: "Book your stay", text: "Pick your dates and confirm in a few taps." },
  { n: 4, title: "Live like a local", text: "Join walks, kitchens and trails only locals know." },
];

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: stays = [] } = useQuery({
    queryKey: ["home-stays"],
    queryFn: async () => {
      const res = await getProperties({ limit: 6 });
      return res.items.map(normalizeProperty);
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate">
        <img
          src="/images/hero.jpg"
          alt="Misty Western Ghats valley at sunrise"
          width={1600}
          height={1008}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 hero-overlay" />
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> Stay with Locals, Pay Less, Experience More.
          </span>
          <h1 className="mt-5 font-display text-4xl leading-tight font-bold text-primary-foreground sm:text-6xl">
            Stay with Locals. Pay Less. Experience More.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/85 sm:text-lg">
            Discover affordable local stays and experience every destination like a local.
          </p>

          <form
            className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-2 rounded-3xl bg-background/95 p-2 shadow-lift sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/stays", search: { q } });
            }}
          >
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Where to? Try Lonavala or Pune"
              className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="lg" className="h-12 rounded-2xl px-6">
              <Search className="size-4" /> Search stays
            </Button>
          </form>
        </div>
      </section>

      {/* Destinations */}
      <Section title="Popular destinations" subtitle="Where StayLocal travellers are heading">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.name}
              to="/stays"
              search={{ q: d.name }}
              className="group relative overflow-hidden rounded-3xl shadow-soft"
            >
              <img
                src={d.image}
                alt={d.name}
                loading="lazy"
                className="aspect-3/4 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 hero-overlay" />
              <div className="absolute bottom-3 left-3 text-primary-foreground">
                <p className="font-display text-lg font-semibold">{d.name}</p>
                <p className="text-xs opacity-85">{d.tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Recommended */}
      <Section title="Recommended stays" subtitle="Rooms in local homes, loved by past guests">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stays.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/stays">
            <Button variant="outline" size="lg" className="rounded-full">
              Browse all local homes
            </Button>
          </Link>
        </div>
      </Section>

      {/* Verified hosts */}
      <Section title="Verified hosts" subtitle="Real people, checked listings">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { t: "Host verification", d: "Every host is reviewed by our admin team before listings go live." },
            { t: "📍 Location Verified", d: "Hosts confirm their room photo on-site with GPS within 50 metres of the listed address." },
            { t: "Honest reviews", d: "Ratings come from guests who actually completed a stay." },
          ].map((c) => (
            <div key={c.t} className="surface-card p-6">
              <ShieldCheck className="size-6 text-primary" />
              <p className="mt-3 font-semibold">{c.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Location checks confirm a host was at the listed address when uploading. They do not, on their
          own, prove a room photo is authentic.
        </p>
      </Section>

      {/* Experiences */}
      <Section title="Local experiences" subtitle="Things hosts love sharing">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCES.map((e) => (
            <div key={e.title} className="surface-card p-5">
              <span className="text-2xl">{e.emoji}</span>
              <p className="mt-2 font-semibold">{e.title}</p>
              <p className="text-xs font-medium text-primary">{e.place}</p>
              <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section title="How it works" subtitle="Four simple steps">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-secondary/50 p-6">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {s.n}
              </span>
              <p className="mt-3 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Rewards + become a host */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-primary p-8 text-primary-foreground shadow-lift">
            <Gift className="size-7" />
            <h2 className="mt-3 font-display text-2xl font-semibold">StayLocal Rewards</h2>
            <p className="mt-2 text-sm opacity-90">
              Complete a stay and unlock a 🎁 ₹100 StayLocal Reward coupon you can use on your next
              booking.
            </p>
            <Link to="/stays" className="mt-5 inline-block">
              <Button variant="secondary" className="rounded-full">
                Start earning
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <h2 className="font-display text-2xl font-semibold">Become a host</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Have a spare room? List it in minutes, set your own price, and welcome travellers who
              want the real version of your town.
            </p>
            <Link to="/auth" search={{ mode: "signup", role: "host" }} className="mt-5 inline-block">
              <Button className="rounded-full">List your room</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
