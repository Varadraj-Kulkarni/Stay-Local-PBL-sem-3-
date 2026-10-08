import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Printer, QrCode, Sparkles, Star, X, Calendar, MapPin, Ticket, Gift, CreditCard } from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "@/lib/auth";
import { rupees } from "@/lib/staylocal";
import { listBookings, getBookingVoucher } from "@/lib/api/bookings";
import { getRewards } from "@/lib/api/rewards";
import { createReview } from "@/lib/api/reviews";
import type { Booking, BookingVoucher } from "../../../server/src/shared/types.ts";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "My trips & Vouchers — StayLocal" },
      { name: "description", content: "Your StayLocal booking history, printable vouchers and rewards." },
      { property: "og:title", content: "My trips & Vouchers — StayLocal" },
      { property: "og:description", content: "Your StayLocal booking history, printable vouchers and rewards." },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedVoucher, setSelectedVoucher] = useState<BookingVoucher | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [busy, setBusy] = useState(false);

  const bookings = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      return await listBookings();
    },
  });

  const rewards = useQuery({
    queryKey: ["my-rewards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      return await getRewards();
    },
  });

  const openVoucherModal = async (bookingId: string) => {
    try {
      const v = await getBookingVoucher(bookingId);
      setSelectedVoucher(v);
    } catch (err: any) {
      toast.error(err?.message || "Could not load voucher");
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setBusy(true);
    try {
      await createReview(reviewBooking.propertyId, {
        bookingId: reviewBooking.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Review submitted! Thank you for sharing your experience.");
      setReviewBooking(null);
      setReviewComment("");
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit review.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Dashboard Top Header (MakeMyTrip Style) */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-primary to-teal-900 p-6 sm:p-8 text-primary-foreground shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
            <Ticket className="size-3.5" /> Traveller Itinerary & Rewards
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            My Trips & Digital Vouchers
          </h1>
          <p className="text-sm text-emerald-100/80 max-w-xl leading-relaxed">
            Manage your homestay reservations, download offline entry QR vouchers, and redeem unlocked ₹100 coupons.
          </p>
        </div>

        <div className="z-10 shrink-0">
          <Link to="/stays">
            <button className="rounded-xl bg-white text-emerald-950 px-5 py-2.5 text-sm font-bold shadow-md hover:bg-emerald-50 transition-all">
              Book Another Stay
            </button>
          </Link>
        </div>
      </div>

      {/* Rewards Wallet Section (High contrast card) */}
      {(rewards.data ?? []).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Gift className="size-5 text-gold-foreground" /> StayLocal Rewards Wallet
            </h3>
            <span className="text-xs text-muted-foreground">
              {rewards.data!.filter((r) => r.status === "AVAILABLE").length} active coupon(s)
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.data!.map((r) => (
              <div
                key={r.id}
                className={`rounded-2xl border p-4.5 transition-all shadow-xs ${
                  r.status === "AVAILABLE"
                    ? "border-emerald-500/40 bg-card hover:border-emerald-500/70"
                    : "border-border bg-muted/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary flex items-center gap-1.5 text-sm">
                    <Sparkles className="size-4 text-gold-foreground" /> ₹{r.amount} Discount
                  </span>
                  <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full font-bold tracking-wider ${
                    r.status === "AVAILABLE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {r.status}
                  </span>
                </div>

                <div className="mt-3 p-2 rounded-lg bg-secondary/80 border border-border/70 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold tracking-wider text-foreground">
                    {r.code}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Single-use</span>
                </div>

                <p className="text-[11px] text-muted-foreground mt-2">
                  {r.status === "AVAILABLE" ? "Automatically applicable at checkout." : "Already redeemed on booking."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-bold text-foreground">
          Trip Itinerary ({bookings.data?.length ?? 0})
        </h3>

        {bookings.isLoading && <p className="text-muted-foreground text-sm">Loading your reservations…</p>}
        {bookings.data?.length === 0 && (
          <div className="surface-card rounded-2xl p-12 text-center border border-dashed border-border">
            <Calendar className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground">No trips booked yet</p>
            <p className="text-xs text-muted-foreground mt-1">Ready for your next weekend escape? Discover authentic village homestays.</p>
            <Link to="/stays" className="inline-block mt-4 rounded-xl bg-primary px-6 py-2.5 text-xs text-primary-foreground font-semibold shadow-xs">
              Explore Maharashtra Homestays
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {bookings.data?.map((b: Booking) => (
            <div
              key={b.id}
              className="surface-card flex flex-col gap-5 rounded-2xl p-5 sm:p-6 border border-border/80 shadow-xs hover:border-primary/40 transition-all sm:flex-row sm:items-center justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {b.propertyTitle}
                  </h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    b.status === "CONFIRMED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {b.status}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Method: {b.paymentMethod}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" /> {b.propertyLocation} · <span className="font-mono text-[11px]">Ref: {b.id}</span>
                </p>

                <p className="text-xs text-foreground/90 flex items-center gap-2 pt-0.5">
                  <Calendar className="size-3.5 text-primary" />
                  <strong>{b.checkIn}</strong> to <strong>{b.checkOut}</strong> ({b.nightCount} night{b.nightCount === 1 ? "" : "s"}) · {b.guests} guest{b.guests === 1 ? "" : "s"}
                </p>

                <div className="pt-1 flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">Final Bill Paid:</span>
                  <span className="font-display text-lg font-bold text-primary">
                    {rupees(b.total)}
                  </span>
                  {b.discount > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      ₹{b.discount} Coupon Saved
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                <button
                  onClick={() => openVoucherModal(b.id)}
                  className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-xs"
                >
                  <QrCode className="size-4" /> View Entry Voucher (QR)
                </button>

                <button
                  onClick={() => setReviewBooking(b)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:border-primary transition-colors"
                >
                  Rate & Review Stay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voucher Modal */}
      {selectedVoucher && (
        <VoucherModal voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setReviewBooking(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 border border-border shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold">Review your stay at {reviewBooking.propertyTitle}</h3>
            <form onSubmit={submitReview} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-110"
                    >
                      <Star className={`size-6 ${star <= reviewRating ? "fill-gold text-gold" : "text-border"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Comment</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell other travellers about the room, hospitality, home-cooked food..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewBooking(null)} className="rounded-md border px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground font-semibold">
                  {busy ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function VoucherModal({ voucher, onClose }: { voucher: BookingVoucher; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (voucher.qrPayload) {
      QRCode.toDataURL(voucher.qrPayload, { width: 140, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [voucher.qrPayload]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-md bg-card p-6 sm:p-8 shadow-lg border border-border print:border-none print:shadow-none print:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl"></span>
            <span className="font-display text-xl font-bold text-primary">StayLocal Official Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Printer className="size-3.5" /> Print Voucher
            </button>
            <button onClick={onClose} className="rounded-md p-1.5 hover:bg-secondary text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper Layout */}
        <div className="mt-4 rounded-2xl bg-secondary/30 p-6 border border-border space-y-5 print:border-2 print:border-foreground/30 print:bg-white print:text-black">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Stay Confirmation</p>
              <h2 className="font-display text-2xl font-bold text-foreground mt-0.5">{voucher.property.title}</h2>
              <p className="text-sm text-muted-foreground"> {voucher.property.location} ({voucher.property.address})</p>
            </div>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Voucher QR Code" className="size-24 rounded-lg border border-border shadow-sm" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Check-In</p>
              <p className="font-bold text-foreground">{voucher.checkIn}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Check-Out</p>
              <p className="font-bold text-foreground">{voucher.checkOut}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Duration & Guests</p>
              <p className="font-medium text-foreground">{voucher.nightCount} night(s) · {voucher.guests} guest(s)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Verification Code</p>
              <p className="font-mono font-bold text-primary">{voucher.verificationCode}</p>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Host Information</p>
            <p className="font-medium">{voucher.host.displayName} ·  {voucher.host.phone}</p>
          </div>

          <div className="rounded-xl bg-background p-4 border border-border space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{voucher.pricing.subtotal}</span>
            </div>
            {voucher.pricing.discount > 0 && (
              <div className="flex justify-between text-primary font-medium">
                <span>StayLocal Reward Discount</span>
                <span>−₹{voucher.pricing.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-border pt-2 text-foreground">
              <span>Total Paid</span>
              <span>₹{voucher.pricing.total}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Payment Method: <strong>{voucher.paymentMethod}</strong> · Status: <span className="uppercase font-semibold text-primary">{voucher.status}</span>
            </p>
          </div>

          {voucher.rewardCoupon && (
            <div className="rounded-xl bg-secondary/80 p-3.5 border border-primary/30 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-primary"> ₹{voucher.rewardCoupon.amount} Reward Code Unlocked:</p>
                <p className="font-mono font-bold text-sm text-foreground mt-0.5">{voucher.rewardCoupon.code}</p>
              </div>
              <span className="text-muted-foreground text-right">Valid for 180 days<br/>on your next stay</span>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground pt-2">
            "Stay with Locals, Pay Less, Experience More." · StayLocal Community Homestay Network
          </p>
        </div>
      </div>
    </div>
  );
}
