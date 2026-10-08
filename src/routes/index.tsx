import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Gift,
  Search,
  ShieldCheck,
  Sparkles,
  Compass,
  Utensils,
  Waves,
  MapPin,
  Heart,
  Users,
  Coins,
  Flame,
  CheckCircle2,
  ArrowRight,
  Coffee,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCard } from "@/components/property-card";
import { DESTINATIONS, EXPERIENCES, normalizeProperty } from "@/lib/staylocal";
import { getProperties } from "@/lib/api/properties";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StayLocal — Authentic Homestays & Regional Cultural Experiences" },
      {
        name: "description",
        content:
          "Discover verified local homestays across Maharashtra. Connect directly with rural families, savour woodfire culinary traditions, and support village economies.",
      },
      { property: "og:title", content: "StayLocal — Authentic Homestays & Regional Cultural Experiences" },
      {
        property: "og:description",
        content: "Verified local homestays, home-cooked regional feasts, and native village experiences.",
      },
    ],
  }),
  component: Home,
});

const CULINARY_HIGHLIGHTS = [
  {
    title: "Chulha Bhakri & Thecha",
    location: "Bhimashankar & Sahyadri Foothills",
    image: "/images/dishes/bhakri-thecha.jpg",
    desc: "Stoneground organic jowar or bajra flatbread baked over aromatic woodfire stoves, served with fiery green chilli-garlic thecha and hand-churned white butter.",
    tag: "Woodfire Cooking",
  },
  {
    title: "Morning Poha & Kadak Adrak Chai",
    location: "Lonavala & Khandala Orchard Homes",
    image: "/images/dishes/poha-chai.jpg",
    desc: "Freshly tempered flattened rice with roasted mountain peanuts, mustard, curry leaves, and grated coconut, accompanied by boiling crushed ginger tea.",
    tag: "Farm Breakfast",
  },
  {
    title: "Authentic Gavran & Pithla Feast",
    location: "Visapur Village Farmhouses",
    image: "/images/dishes/pithla-feast.jpeg",
    desc: "Simmered chickpea flour curry seasoned with cumin, garlic, and fresh coriander. Served alongside piping hot bhakri and wild forest greens.",
    tag: "Village Tradition",
  },
  {
    title: "Ukadiche Modak & Puran Poli",
    location: "Old Pune Heritage Wadas",
    image: "/images/dishes/modak-puran-poli.jpeg",
    desc: "Steamed rice flour dumplings filled with grated coconut and jaggery, or slow-cooked lentil flatbreads brushed with warm clarified desi ghee.",
    tag: "Heritage Dessert",
  },
];

const COMMUNITY_IMPACT = [
  {
    icon: Coins,
    title: "100% Direct Host Earnings",
    desc: "Unlike corporate hotel chains where revenue leaks to multinational conglomerates, your stay money directly finances village children's education and local family livelihoods.",
  },
  {
    icon: Users,
    title: "Preserving Ancestral Living",
    desc: "By staying in traditional wadas and countryside farm cottages, you incentivize families to maintain historic architecture and continue sustainable agro-farming.",
  },
  {
    icon: Heart,
    title: "Sustainable, Anti-Mass Tourism",
    desc: "We route travellers to serene native communities rather than choked commercial resort strips, reducing plastic pollution and ecological stress on sensitive hill ecosystems.",
  },
];

const COMPARISONS = [
  {
    feature: "Authentic Food",
    staylocal: "Home-cooked chulha meals using garden-grown vegetables & family recipes",
    hotels: "Mass-produced generic buffet prepared with frozen ingredients",
  },
  {
    feature: "Destination Knowledge",
    staylocal: "Local hosts who grew up navigating secret waterfalls & untouched fort trails",
    hotels: "Commissioned front-desk brochures pointing to crowded tourist traps",
  },
  {
    feature: "Community Support",
    staylocal: "100% direct economic transfer into the hands of local rural families",
    hotels: "Profits diverted to corporate headquarters and third-party booking conglomerates",
  },
  {
    feature: "Location Verification",
    staylocal: "Tamper-proof GPS camera verification within 50 metres of physical home",
    hotels: "Generic stock photography with misleading wide-angle views",
  },
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
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden">
        <img
          src="/images/hero.jpg"
          alt="Misty Western Ghats Sahyadri valley at sunrise"
          width={1600}
          height={1008}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 hero-overlay" />
        
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-32">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/90 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs backdrop-blur-md">
            <Sparkles className="size-3.5 text-primary" /> Stay with Locals · Pay Less · Experience Real Culture
          </div>

          <h1 className="mt-5 font-display text-4xl leading-tight font-bold text-white sm:text-6xl drop-shadow-sm">
            Experience Maharashtra Through <br className="hidden sm:inline" />
            The Eyes of Its Localites.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg font-normal leading-relaxed">
            Ditch the cookie-cutter hotels. Book hand-picked, GPS-verified homestays, taste authentic 
            woodfire home cooking, and support village families directly.
          </p>

          {/* MakeMyTrip / OYO Inspired Floating Search Panel */}
          <form
            className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl bg-card/95 p-2.5 shadow-2xl backdrop-blur-md border border-white/40 sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/stays", search: { q } });
            }}
          >
            <div className="flex flex-1 items-center px-3.5 gap-2.5">
              <Search className="size-5 text-primary shrink-0" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Where to? Try Lonavala, Visapur Fort, Pune or Bhimashankar..."
                className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 px-0"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-xl px-8 font-semibold shadow-md text-base">
              Explore Stays
            </Button>
          </form>

          {/* Quick Filter Badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-white/90">
            <span className="font-medium text-white/75">Popular searches:</span>
            {["Lonavala", "Visapur Fort", "Bhimashankar", "Pune"].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => navigate({ to: "/stays", search: { q: loc } })}
                className="rounded-full bg-black/40 px-3 py-1 hover:bg-black/60 backdrop-blur-xs transition-colors border border-white/20"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations Grid (MakeMyTrip Inspired) */}
      <Section
        title="Popular Regional Destinations"
        subtitle="Explore authentic Sahyadri hill valleys, temple forests, and heritage cities across India"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.name}
              to="/stays"
              search={{ q: d.name }}
              className="group relative overflow-hidden rounded-2xl shadow-sm border border-border/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <img
                src={d.image}
                alt={d.name}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/hero.jpg";
                }}
                className="aspect-3/4 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground uppercase tracking-wide mb-1">
                  Verified Homestays
                </span>
                <p className="font-display text-lg font-bold tracking-tight">{d.name}</p>
                {"landmark" in d && (
                  <p className="text-[11px] text-amber-300/90 font-medium truncate mb-1">
                    {d.landmark}
                  </p>
                )}
                <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">{d.tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Recommended Stays (OYO / MakeMyTrip Card Design) */}
      <Section
        title="Featured Verified Homestays"
        subtitle="Cosy, clean rooms hosted by real rural families. Verified via on-site GPS technology."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stays.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/stays">
            <Button variant="outline" size="lg" className="rounded-xl px-8 border-primary text-primary hover:bg-primary/5 font-semibold">
              Browse All Available Homes ({stays.length}+ Listed)
            </Button>
          </Link>
        </div>
      </Section>

      {/* Culinary Section: Taste True Maharashtra */}
      <section className="bg-card/70 border-y border-border/80 py-16 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold-foreground text-xs font-semibold mb-2">
                <Utensils className="size-3.5 text-gold-foreground" /> Earthen Flavours
              </span>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Taste True Regional Culinary: From Chulha to Plate
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Nothing compares to farm-fresh food cooked over open woodfire by your host family. 
                Experience time-honoured recipes passed down through generations.
              </p>
            </div>
            <Link to="/stays">
              <Button variant="ghost" className="text-primary font-semibold text-sm gap-1 hover:bg-primary/10">
                Explore Culinary Stays <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CULINARY_HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/40"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/hero.jpg";
                    }}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                    {item.tag}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-primary">
                    <MapPin className="size-3" /> {item.location}
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Impact: How StayLocal Empowers Localites */}
      <Section
        title="Community Impact: How You Support Rural Livelihoods"
        subtitle="Tourism that gives back. Every rupee you spend enriches rural economies and preserves indigenous culture."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {COMMUNITY_IMPACT.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="surface-card rounded-2xl p-6 sm:p-7 border border-border/80 hover:border-primary/50 transition-all hover:shadow-md"
              >
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Icon className="size-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {c.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Verification Tech Callout */}
        <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-md">
            <ShieldCheck className="size-9" />
          </div>
          <div className="space-y-1.5 flex-1 text-center md:text-left">
            <h4 className="font-display text-xl font-bold text-foreground">
              Anti-Fraud GPS Verification: No Ghost Listings
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every StayLocal host must physically capture photos on-site using our mobile camera & GPS 
              geofencing engine. If the device is more than 50 metres from the registered property address, 
              the listing is automatically rejected.
            </p>
          </div>
          <Link to="/auth" search={{ mode: "signup", role: "host" }}>
            <Button className="rounded-xl px-6 py-2.5 font-semibold shrink-0 shadow-sm">
              Become a Verified Host
            </Button>
          </Link>
        </div>
      </Section>

      {/* Local Experiences Guided by Native Hosts */}
      <Section
        title="Native Experiences Guided by Hosts"
        subtitle="Unscripted adventures with the local families who grew up on these mountain slopes"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCES.map((e) => {
            const IconComponent =
              e.icon === "Compass"
                ? Compass
                : e.icon === "Utensils"
                ? Utensils
                : e.icon === "Waves"
                ? Waves
                : MapPin;
            return (
              <div key={e.title} className="surface-card p-5 hover:border-primary/50 transition-all hover:shadow-md">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <IconComponent className="size-5" />
                </div>
                <p className="font-semibold text-base text-foreground">{e.title}</p>
                <p className="text-xs font-semibold text-primary mt-0.5">{e.place}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{e.detail}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Comparison Matrix: StayLocal vs Commercial Hotel Chains */}
      <Section
        title="StayLocal vs Conventional Commercial Hotels"
        subtitle="Why discerning travellers choose authentic homestays over anonymous hotel rooms"
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/70 border-b border-border text-foreground font-semibold">
                <tr>
                  <th className="py-4 px-6 w-1/4">Aspect</th>
                  <th className="py-4 px-6 w-5/12 text-primary font-bold bg-primary/5">
                    StayLocal Homestays
                  </th>
                  <th className="py-4 px-6 w-5/12 text-muted-foreground">
                    Standard Commercial Hotels
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {COMPARISONS.map((row) => (
                  <tr key={row.feature} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-foreground">{row.feature}</td>
                    <td className="py-4 px-6 bg-primary/5 text-foreground leading-relaxed">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                        <span>{row.staylocal}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground leading-relaxed">
                      <div className="flex items-start gap-2">
                        <XCircle className="size-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                        <span>{row.hotels}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Rewards + Host CTA Banner */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ₹100 Coupon promotion */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-emerald-950 p-8 text-primary-foreground shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <Gift className="size-9 text-gold" />
            <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold">
              StayLocal Reward Coupons
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/90 leading-relaxed">
              Every completed stay automatically unlocks an instant ₹100 reward coupon (code format: <span className="font-mono font-semibold">STAY100-XXXXXX</span>) redeemable directly against your next weekend escape.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link to="/stays">
                <Button variant="secondary" className="rounded-xl px-6 font-semibold shadow-xs">
                  Book Your First Stay
                </Button>
              </Link>
            </div>
          </div>

          {/* Become a Host Card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-primary text-xs font-semibold mb-3">
                <Users className="size-3.5" /> Direct Community Income
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Own a Spare Room or Farmhouse?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Join our network of verified village hosts. Set your own nightly rates, welcome 
                respectful nature travellers, and generate meaningful supplementary income without middlemen.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/auth" search={{ mode: "signup", role: "host" }}>
                <Button className="rounded-xl px-7 font-semibold shadow-sm">
                  Register as a Local Host →
                </Button>
              </Link>
            </div>
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
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
