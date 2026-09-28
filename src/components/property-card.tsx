import { Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck, Star } from "lucide-react";
import { rupees, type Property } from "@/lib/staylocal";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to="/property/$id"
      params={{ id: property.id }}
      className="group block overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={property.photos[0] ?? "/images/hero.jpg"}
          alt={property.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {property.location_verified && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary shadow-soft">
            📍 Location Verified
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
          {rupees(property.price_per_night)}
          <span className="text-xs font-normal opacity-80"> / night</span>
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight font-semibold">{property.name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
            <Star className="size-4 fill-gold text-gold" />
            {property.rating || "New"}
          </span>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4" /> {property.location}
        </p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          Hosted by {property.host_name}
          {property.host_verified && <ShieldCheck className="size-4 text-primary" />}
        </p>
      </div>
    </Link>
  );
}
