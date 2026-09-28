import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, ShieldCheck, Star, Sparkles, CreditCard, QrCode, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import {
  nightsBetween,
  normalizeProperty,
  rupees,
  type Property,
} from "@/lib/staylocal";
import { getPropertyById } from "@/lib/api/properties";
import { getPropertyReviews } from "@/lib/api/reviews";
import { getRewards, validateCoupon } from "@/lib/api/rewards";
import { createBooking } from "@/lib/api/bookings";
import type { PaymentMethod } from "../../server/src/shared/types.ts";

export const Route = createFileRoute("/property/$id")({
  head: () => ({
    meta: [
      { title: "Local stay details — StayLocal" },
      { name: "description", content: "Photos, price, amenities, host profile and reviews for this local stay." },
      { property: "og:title", content: "Local stay details — StayLocal" },
      { property: "og:description", content: "See what this local home offers and book your dates." },
    ],
  }),
  component: PropertyPage,
  errorComponent: () => <Centered>We couldn't load this stay.</Centered>,
  notFoundComponent: () => <Centered>This stay is no longer listed.</Centered>,
});

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-24 text-center text-muted-foreground">{children}</div>;
}

function PropertyPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState("2026-11-10");
  const [checkOut, setCheckOut] = useState("2026-11-12");
  const [guests, setGuests] = useState(2);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI_QR");
  const [busy, setBusy] = useState(false);

  const { data: rawProp, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      return await getPropertyById(id);
    },
  });

  const property: Property | null = rawProp ? normalizeProperty(rawProp) : null;

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      return await getPropertyReviews(id);
    },
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ["my-rewards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      return await getRewards();
    },
  });

  const availableRewards = rewards.filter((r) => r.status === "AVAILABLE");

  if (isLoading) return <Centered>Loading stay…</Centered>;
  if (!property) return <Centered>This stay is no longer listed.</Centered>;

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = nights * property.price_per_night;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const applyCouponCode = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      toast.error("Please enter a coupon code.");
      return;
    }
    if (nights <= 0) {
      toast.error("Please select valid stay dates first.");
      return;
    }
    try {
      const res = await validateCoupon(code, subtotal);
      if (res.valid) {
        setAppliedCoupon({ code: res.couponCode, discount: res.discount });
        toast.success(res.message || `₹${res.discount} discount applied!`);
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      toast.error(err?.message || "Invalid or already used coupon code.");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.info("Coupon removed.");
  };

  const book = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signin", role: "tourist" } });
      return;
    }
    if (nights <= 0) {
      toast.error("Pick a check-in and check-out date.");
      return;
    }
    setBusy(true);
    try {
      const booking = await createBooking({
        propertyId: property.id,
        checkIn,
        checkOut,
        guests,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        paymentMethod,
      });

      toast.success("Booking confirmed! 🎉 A ₹100 reward coupon was issued to your account.");
      navigate({ to: "/bookings", search: { booking: booking.id } });
    } catch (err: any) {
      toast.error(err?.message || "Booking failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl shadow-soft">
        <img
          src={property.photos[0] ?? "/images/hero.jpg"}
          alt={property.name}
          className="aspect-16/9 w-full object-cover"
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {property.location_verified ? (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                📍 Location Verified
              </span>
            ) : (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                Location could not be verified.
              </span>
            )}
            <span className="flex items-center gap-1 text-sm font-medium">
              <Star className="size-4 fill-gold text-gold" />
              {property.rating || "New"} · {property.review_count} reviews
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-semibold">{property.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4" /> {property.location}
          </p>
          <p className="mt-5 leading-relaxed text-foreground/90">{property.description}</p>

          <h2 className="mt-8 font-display text-xl font-semibold">Amenities</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {property.amenities.map((a) => (
              <span key={a} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm">
                {a}
              </span>
            ))}
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold">Your host</h2>
          <div className="surface-card mt-3 flex items-center gap-3 p-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary font-display text-lg font-semibold">
              {property.host_name.charAt(0)}
            </span>
            <div>
              <p className="flex items-center gap-1 font-semibold">
                {property.host_name}
                {property.host_verified && <ShieldCheck className="size-4 text-primary" />}
              </p>
              <p className="text-sm text-muted-foreground">
                {property.host_verified ? "Verified local host" : "Verification pending"}
              </p>
            </div>
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold">Reviews</h2>
          <div className="mt-3 space-y-3">
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="surface-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {r.touristName}
                  <span className="flex items-center gap-0.5 text-gold">
                    <Star className="size-3.5 fill-gold" /> {r.rating}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Booking panel */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="surface-card p-6">
            <p className="font-display text-2xl font-semibold">
              {rupees(property.price_per_night)}
              <span className="text-base font-normal text-muted-foreground"> / night</span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="in">Check in</Label>
                <Input id="in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="out">Check out</Label>
                <Input id="out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="guests">Guests</Label>
              <Input
                id="guests"
                type="number"
                min={1}
                max={10}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              />
            </div>

            {/* Simulated Payment Methods */}
            <div className="mt-4 space-y-2">
              <Label>Simulated Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI_QR")}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all ${
                    paymentMethod === "UPI_QR"
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <QrCode className="size-4" /> UPI QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("DEMO_CARD")}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all ${
                    paymentMethod === "DEMO_CARD"
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <CreditCard className="size-4" /> Demo Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("PAY_AT_STAY")}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all ${
                    paymentMethod === "PAY_AT_STAY"
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Banknote className="size-4" /> Pay at Stay
                </button>
              </div>
            </div>

            {/* Reward Coupon Section */}
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <Label htmlFor="coupon">StayLocal Reward Coupon</Label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-secondary/80 p-2.5 text-sm text-primary font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-4" /> {appliedCoupon.code} (−{rupees(appliedCoupon.discount)})
                  </span>
                  <button onClick={removeCoupon} className="text-xs text-destructive underline font-normal">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    placeholder="e.g. STAY100-AB12CD"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="h-9 text-xs uppercase"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => applyCouponCode()}>
                    Apply
                  </Button>
                </div>
              )}

              {/* Quick Coupon Helpers */}
              {!appliedCoupon && availableRewards.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground mb-1">Your available coupons:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableRewards.map((rw) => (
                      <button
                        type="button"
                        key={rw.code}
                        onClick={() => {
                          setCouponInput(rw.code);
                          applyCouponCode(rw.code);
                        }}
                        className="rounded-lg border border-dashed border-primary/40 bg-secondary/50 px-2 py-0.5 text-xs text-primary hover:bg-secondary transition-colors"
                      >
                        🎁 {rw.code} (₹{rw.amount})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {nights} night{nights === 1 ? "" : "s"}
                </span>
                <span>{rupees(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary font-medium">
                  <span>Server-Validated Reward</span>
                  <span>−{rupees(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{rupees(total)}</span>
              </div>
            </div>

            <Button className="mt-5 w-full rounded-full" onClick={book} disabled={busy}>
              {user ? (busy ? "Processing…" : `Confirm Stay (${rupees(total)})`) : "Sign in to book"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
