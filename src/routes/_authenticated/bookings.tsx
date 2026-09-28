import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Printer, QrCode, Sparkles, Star, X } from "lucide-react";
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-primary font-bold">My Trips & Rewards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access your stay confirmations, digital vouchers, and unlocked ₹100 rewards.
          </p>
        </div>
      </div>

      {/* Rewards Wallet Section */}
      {(rewards.data ?? []).length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            🎁 StayLocal Reward Coupons
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.data!.map((r) => (
              <div
                key={r.id}
                className={`rounded-2xl border p-4 transition-all ${
                  r.status === "AVAILABLE"
                    ? "border-primary/40 bg-secondary/70 shadow-soft"
                    : "border-border bg-card/60 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="size-4" /> ₹{r.amount} Reward
                  </span>
                  <span className={`text-xs uppercase px-2 py-0.5 rounded-full font-medium ${
                    r.status === "AVAILABLE" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm font-mono font-semibold mt-2 tracking-wide text-foreground">
                  {r.code}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {r.status === "AVAILABLE" ? "Ready to redeem on your next booking!" : "Already redeemed."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings List */}
      <div className="mt-8 space-y-4">
        {bookings.isLoading && <p className="text-muted-foreground">Loading your trips…</p>}
        {bookings.data?.length === 0 && (
          <div className="surface-card rounded-2xl p-8 text-center border border-border">
            <p className="text-muted-foreground">No trips booked yet.</p>
            <Link to="/stays" className="inline-block mt-3 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground font-semibold">
              Browse Local Stays
            </Link>
          </div>
        )}
        {bookings.data?.map((b: Booking) => (
          <div
            key={b.id}
            className="surface-card flex flex-col gap-4 rounded-2xl p-5 border border-border sm:flex-row sm:items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {b.propertyTitle}
                </h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  b.status === "CONFIRMED"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {b.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                📍 {b.propertyLocation} · Booking ID: <span className="font-mono text-xs">{b.id}</span>
              </p>
              <p className="text-sm text-foreground/90 pt-1">
                📅 <strong>{b.checkIn}</strong> → <strong>{b.checkOut}</strong> ({b.nightCount} night{b.nightCount === 1 ? "" : "s"}) · {b.guests} guest(s)
              </p>
              <p className="text-base font-bold text-primary pt-1">
                Total Paid: {rupees(b.total)} {b.discount > 0 && <span className="text-xs font-normal text-muted-foreground">(₹{b.discount} reward used)</span>}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
              <button
                onClick={() => openVoucherModal(b.id)}
                className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <QrCode className="size-3.5" /> View Voucher
              </button>

              <button
                onClick={() => setReviewBooking(b)}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:border-primary transition-colors"
              >
                ⭐ Review Stay
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Voucher Modal */}
      {selectedVoucher && (
        <VoucherModal voucher={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setReviewBooking(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                <button type="button" onClick={() => setReviewBooking(null)} className="rounded-full border px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground font-semibold">
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
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-card p-6 sm:p-8 shadow-2xl border border-border print:border-none print:shadow-none print:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <span className="font-display text-xl font-bold text-primary">StayLocal Official Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Printer className="size-3.5" /> Print Voucher
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">📍 {voucher.property.location} ({voucher.property.address})</p>
            </div>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Voucher QR Code" className="size-24 rounded-lg border border-border shadow-soft" />
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
            <p className="font-medium">{voucher.host.displayName} · 📞 {voucher.host.phone}</p>
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
                <p className="font-semibold text-primary">🎁 ₹{voucher.rewardCoupon.amount} Reward Code Unlocked:</p>
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
