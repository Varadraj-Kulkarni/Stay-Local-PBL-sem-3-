import { Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck, Star } from "lucide-react";
import { rupees, type Property } from "@/lib/staylocal";

export function PropertyCard({ property }: { property: Property }) {
  const originalPrice = Math.round(property.price_per_night * 1.3);

  return (
    <Link
      to="/property/$id"
      params={{ id: property.id }}
      className="group block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <img
          src={property.photos[0] ?? "/images/hero.jpg"}
          alt={property.name}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/images/hero.jpg";
          }}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Verification & Local Host Chips */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 items-start">
          {property.location_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-xs backdrop-blur-xs">
              <ShieldCheck className="size-3 text-primary" /> GPS Verified
            </span>
          )}
          <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
            Village Homestay
          </span>
        </div>

        {/* Rating chip on photo corner */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-700/90 px-2 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-xs">
            <Star className="size-3 fill-white text-white" />
            {property.rating ? Number(property.rating).toFixed(1) : "4.8"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors mt-1 line-clamp-1">
            {property.name}
          </h3>
        </div>

        {/* Host attribution & review count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
          <span className="truncate">
            Host: <strong className="text-foreground font-medium">{property.host_name}</strong>
          </span>
          <span className="text-[11px]">
            {property.review_count || 12} reviews
          </span>
        </div>

        {/* Price & Value Banner (MakeMyTrip style) */}
        <div className="flex items-end justify-between pt-1">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground line-through">
                {rupees(originalPrice)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                25% OFF
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-bold text-primary">
                {rupees(property.price_per_night)}
              </span>
              <span className="text-xs text-muted-foreground font-normal">/ night</span>
            </div>
          </div>

          <span className="text-xs font-semibold text-primary underline group-hover:no-underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
