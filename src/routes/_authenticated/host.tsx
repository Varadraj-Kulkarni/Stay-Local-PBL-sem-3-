import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AMENITY_OPTIONS, DESTINATIONS, normalizeProperty, rupees, type Property } from "@/lib/staylocal";
import { createProperty, updateProperty, getProperties } from "@/lib/api/properties";
import { listBookings } from "@/lib/api/bookings";
import { verifyPropertyLocation } from "@/lib/api/verification";
import {
  Home,
  Calendar,
  ShieldCheck,
  Camera,
  Plus,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Star,
  DollarSign,
  TrendingUp,
  Edit,
  ArrowRight,
} from "lucide-react";
import type { Booking } from "../../../server/src/shared/types.ts";

export const Route = createFileRoute("/_authenticated/host")({
  head: () => ({
    meta: [
      { title: "Host dashboard — StayLocal" },
      { name: "description", content: "Manage your StayLocal listings, bookings and location verification." },
      { property: "og:title", content: "Host dashboard — StayLocal" },
      { property: "og:description", content: "Manage your StayLocal listings, bookings and location verification." },
    ],
  }),
  component: HostPage,
});

type Form = {
  id?: string;
  name: string;
  destinationId: string;
  location: string;
  description: string;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
  photos: string;
  latitude: string;
  longitude: string;
  available_from: string;
  available_to: string;
};

const empty: Form = {
  name: "",
  destinationId: "dest-lonavala",
  location: "Lonavala",
  description: "",
  price_per_night: 1200,
  max_guests: 2,
  amenities: ["Wi-Fi", "Breakfast"],
  photos: "",
  latitude: "18.7557",
  longitude: "73.4091",
  available_from: "",
  available_to: "",
};

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000 })
  );
}

function HostPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [verifying, setVerifying] = useState<Property | null>(null);

  // In host mode, we fetch properties
  const listings = useQuery({
    queryKey: ["host-listings"],
    queryFn: async () => {
      const res = await getProperties({ limit: 50 });
      return res.items.map(normalizeProperty);
    },
  });

  const bookings = useQuery({
    queryKey: ["host-bookings"],
    queryFn: async () => {
      return await listBookings();
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["host-listings"] });
    qc.invalidateQueries({ queryKey: ["host-bookings"] });
  };

  async function save(f: Form) {
    try {
      const dest = DESTINATIONS.find((d) => d.id === f.destinationId || d.name.toLowerCase().includes(f.location.toLowerCase())) || DESTINATIONS[0]!;
      const photos = f.photos.split(/\s*[\n,]\s*/).filter(Boolean);
      const fallback = dest.image;

      if (f.id) {
        await updateProperty(f.id, {
          title: f.name,
          description: f.description,
          pricePerNight: Number(f.price_per_night),
          maxGuests: Number(f.max_guests),
          amenities: f.amenities,
          photos: photos.length ? photos : [fallback],
          latitude: Number(f.latitude || 18.75),
          longitude: Number(f.longitude || 73.40),
        });
        toast.success("Listing updated. Set to PENDING for admin review.");
      } else {
        await createProperty({
          destinationId: dest.id,
          title: f.name,
          description: f.description,
          pricePerNight: Number(f.price_per_night),
          maxGuests: Number(f.max_guests),
          amenities: f.amenities,
          photos: photos.length ? photos : [fallback],
          latitude: Number(f.latitude || 18.75),
          longitude: Number(f.longitude || 73.40),
        });
        toast.success("Listing submitted for admin approval (PENDING).");
      }
      setForm(null);
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save listing.");
    }
  }

  const [activeTab, setActiveTab] = useState<"listings" | "bookings">("listings");

  const totalEarnings = (bookings.data ?? []).reduce((s: number, b: Booking) => s + Number(b.total), 0);
  const totalGuests = (bookings.data ?? []).reduce((s: number, b: Booking) => s + Number(b.guests), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Top Banner (MakeMyTrip Partner Console Style) */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-primary to-teal-950 p-6 sm:p-8 text-primary-foreground shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
              <ShieldCheck className="size-3.5" /> Verified Local Host
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold text-amber-200">
              <Star className="size-3.5 fill-amber-300 text-amber-300" /> SuperHost Localite
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Host Operations Console
          </h1>
          <p className="text-sm text-emerald-100/80 max-w-xl leading-relaxed">
            Manage your homestay listings, monitor incoming reservations, and execute camera + GPS on-site location verifications.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => setForm(empty)}
            className="flex items-center gap-2 rounded-xl bg-white text-emerald-950 px-5 py-3 text-sm font-bold shadow-md hover:bg-emerald-50 active:scale-98 transition-all"
          >
            <Plus className="size-4 text-emerald-800" /> List New Homestay
          </button>
        </div>
      </div>

      {/* 4 Performance Metric Cards (MakeMyTrip / OYO Style) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card rounded-2xl p-5 border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Booked Revenue</span>
            <div className="size-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <DollarSign className="size-5" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-2">
            {rupees(totalEarnings)}
          </p>
          <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="size-3" /> 100% direct village payout
          </p>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
            <div className="size-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Calendar className="size-5" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-2">
            {bookings.data?.length ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {totalGuests} total travellers hosted
          </p>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Listings</span>
            <div className="size-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Home className="size-5" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-2">
            {listings.data?.length ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            All registered homestays
          </p>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Hospitality Score</span>
            <div className="size-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Star className="size-5" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-2">
            4.95 / 5.0
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Based on completed stays
          </p>
        </div>
      </div>

      {/* Navigation Tabs (MakeMyTrip Style) */}
      <div className="flex border-b border-border/80 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("listings")}
          className={`pb-3.5 transition-colors border-b-2 ${
            activeTab === "listings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Homestay Listings ({listings.data?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`pb-3.5 transition-colors border-b-2 ${
            activeTab === "bookings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Guest Reservations ({bookings.data?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Listings */}
      {activeTab === "listings" && (
        <div className="space-y-4">
          {listings.data?.length === 0 && (
            <div className="surface-card rounded-2xl p-12 text-center border border-dashed border-border">
              <Home className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground">No properties listed yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your spare room or rural cottage to begin receiving guests.</p>
              <button
                onClick={() => setForm(empty)}
                className="mt-4 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs"
              >
                + Add Property
              </button>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {listings.data?.map((p) => (
              <div
                key={p.id}
                className="surface-card overflow-hidden rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/9 overflow-hidden bg-muted">
                    <img src={p.photos[0]} alt={p.name} className="size-full object-cover" />
                    <div className="absolute top-3 right-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs shadow-xs ${
                        p.status === "APPROVED"
                          ? "bg-emerald-800/90 text-white"
                          : "bg-amber-600/90 text-white"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg font-bold text-foreground leading-snug line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3.5 text-primary" /> {p.location}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-display text-lg font-bold text-primary">
                          {rupees(p.price_per_night)}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">/ night</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {p.location_verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="size-3.5" /> GPS Location Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <AlertCircle className="size-3.5" /> GPS Verification Needed
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        Max {p.max_guests ?? 2} Guests
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/40 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:border-primary transition-colors"
                    onClick={() =>
                      setForm({
                        id: p.id,
                        name: p.name,
                        destinationId: "dest-lonavala",
                        location: p.location,
                        description: p.description,
                        price_per_night: p.price_per_night,
                        max_guests: p.max_guests || 2,
                        amenities: p.amenities,
                        photos: p.photos.join("\n"),
                        latitude: p.latitude?.toString() ?? "",
                        longitude: p.longitude?.toString() ?? "",
                        available_from: p.available_from ?? "",
                        available_to: p.available_to ?? "",
                      })
                    }
                  >
                    <Edit className="size-3.5 text-muted-foreground" /> Edit Listing
                  </button>

                  <button
                    className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                    onClick={() => setVerifying(p)}
                  >
                    <Camera className="size-3.5" /> Verify Location (Camera + GPS)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Reservations & Guests (MakeMyTrip Style) */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {(bookings.data ?? []).length === 0 && (
            <div className="surface-card rounded-2xl p-12 text-center border border-dashed border-border">
              <Calendar className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground">No reservations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Confirmed guest stays will appear here in real time.</p>
            </div>
          )}

          <div className="space-y-3">
            {bookings.data?.map((b: Booking) => (
              <div
                key={b.id}
                className="surface-card flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl p-5 border border-border/80 shadow-xs hover:border-primary/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display text-base font-bold text-foreground">
                      {b.propertyTitle}
                    </h4>
                    <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      {b.status}
                    </span>
                    <span className="rounded-full bg-secondary text-primary px-2.5 py-0.5 text-[10px] font-semibold">
                      Payment: {b.paymentMethod}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    <strong>{b.checkIn}</strong> to <strong>{b.checkOut}</strong> ({b.nightCount} nights) · <Users className="size-3.5 ml-1 text-primary" /> {b.guests} guest{b.guests === 1 ? "" : "s"}
                  </p>

                  <p className="text-[11px] text-muted-foreground font-mono">
                    Booking Reference: {b.id}
                  </p>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-1 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                  <span className="text-xs text-muted-foreground">Host Payout Total:</span>
                  <span className="font-display text-xl font-bold text-emerald-700">
                    {rupees(b.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {form && <PropertyForm initial={form} onCancel={() => setForm(null)} onSave={save} />}
      {verifying && <VerifyDialog property={verifying} onClose={() => { setVerifying(null); refresh(); }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface-card rounded-2xl p-5 border border-border">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-display text-3xl font-bold text-primary mt-1">{value}</p>
    </div>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md bg-card p-6 shadow-lg border border-border" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const inputStyle = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

function PropertyForm({ initial, onSave, onCancel }: { initial: Form; onSave: (f: Form) => void; onCancel: () => void }) {
  const [f, setF] = useState(initial);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  async function useGps() {
    try {
      const pos = await getPosition();
      set("latitude", pos.coords.latitude.toFixed(6));
      set("longitude", pos.coords.longitude.toFixed(6));
      toast.success("Current GPS coordinates applied.");
    } catch {
      toast.error("Could not read GPS location.");
    }
  }

  return (
    <Modal onClose={onCancel}>
      <h3 className="font-display text-2xl font-semibold">{f.id ? "Edit Property" : "Add New Property"}</h3>
      <form
        className="mt-4 space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(f);
        }}
      >
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Property Name</label>
          <input required className={inputStyle} placeholder="e.g. Sahyadri Mist Room" value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Destination</label>
            <select
              className={inputStyle}
              value={f.destinationId}
              onChange={(e) => {
                const dest = DESTINATIONS.find((d) => d.id === e.target.value);
                set("destinationId", e.target.value);
                if (dest) set("location", dest.name);
              }}
            >
              {DESTINATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Price / night (₹)</label>
            <input required type="number" min={200} className={inputStyle} value={f.price_per_night} onChange={(e) => set("price_per_night", Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
          <textarea className={inputStyle} rows={3} placeholder="Describe the room, home-cooked food, local views..." value={f.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amenities</label>
          <div className="flex flex-wrap gap-1.5">
            {AMENITY_OPTIONS.map((a) => {
              const on = f.amenities.includes(a);
              return (
                <button
                  type="button"
                  key={a}
                  onClick={() => set("amenities", on ? f.amenities.filter((x) => x !== a) : [...f.amenities, a])}
                  className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                    on ? "border-primary bg-primary text-primary-foreground font-medium" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Latitude</label>
            <input className={inputStyle} placeholder="18.7557" value={f.latitude} onChange={(e) => set("latitude", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Longitude</label>
            <input className={inputStyle} placeholder="73.4091" value={f.longitude} onChange={(e) => set("longitude", e.target.value)} />
          </div>
        </div>
        <button type="button" onClick={useGps} className="text-xs text-primary underline block">
           Use current device coordinates
        </button>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            Save Listing
          </button>
        </div>
      </form>
    </Modal>
  );
}

function VerifyDialog({ property, onClose }: { property: Property; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      // 1. Init upload
      const init = await initUpload({
        fileName: file.name,
        contentType: file.type || "image/jpeg",
        sizeBytes: file.size,
      });

      // 2. Upload file bytes
      await uploadFileBytes(init.uploadUrl, file);
      setUploadedAssetId(init.assetId);
      toast.success("Room photo uploaded successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload photo.");
    } finally {
      setBusy(false);
    }
  };

  async function runVerification(mode: "LIVE" | "SIMULATED_AT_PROPERTY" | "SIMULATED_AWAY") {
    const assetId = uploadedAssetId || "asset-room-cam-01";
    setBusy(true);
    setResult(null);

    try {
      let lat = Number(property.latitude || 18.7557);
      let lon = Number(property.longitude || 73.4091);
      let accuracy: number | undefined;

      if (mode === "LIVE") {
        try {
          const pos = await getPosition();
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          accuracy = Math.round(pos.coords.accuracy);
        } catch {
          toast.info("Could not fetch GPS coords; using property target coordinates.");
        }
      }

      const res = await verifyPropertyLocation(property.id, {
        photoAssetId: assetId,
        capturedLatitude: lat,
        capturedLongitude: lon,
        accuracyMeters: accuracy,
        verificationMode: mode,
      });

      setResult(res);
      if (res.status === "VERIFIED") {
        toast.success(` Location Verified! (${res.distanceMeters}m from registered address)`);
      } else {
        toast.warning(`Location could not be verified. (${res.distanceMeters}m away)`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Verification request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display text-2xl font-semibold">Camera + GPS Location Verification</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Capture a room photo at the property. The backend calculates the Haversine distance from registered coordinates. (Threshold: 50m).
      </p>

      {/* Hidden file input supporting camera capture on mobile */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onClick={() => fileRef.current?.click()}
        className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary transition-colors bg-secondary/30"
      >
        {photoPreview ? (
          <img src={photoPreview} alt="Captured room" className="max-h-48 rounded-xl object-cover shadow-sm" />
        ) : (
          <div className="space-y-1">
            <span className="text-3xl block"></span>
            <p className="text-sm font-semibold">Take Room Photo / Choose Image</p>
            <p className="text-xs text-muted-foreground">Supports mobile device camera or desktop file picker</p>
          </div>
        )}
      </div>

      {/* Verification triggers */}
      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Run Verification Mode:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => runVerification("LIVE")}
            className="rounded-xl border border-primary bg-primary text-primary-foreground py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
          >
            ️ Live GPS
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runVerification("SIMULATED_AT_PROPERTY")}
            className="rounded-xl border border-border bg-card py-2 text-xs font-semibold hover:border-primary disabled:opacity-50"
          >
             Simulate: At Property
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runVerification("SIMULATED_AWAY")}
            className="rounded-xl border border-border bg-card py-2 text-xs font-semibold hover:border-destructive text-destructive disabled:opacity-50"
          >
             Simulate: 2km Away
          </button>
        </div>
      </div>

      {/* Result feedback */}
      {result && (
        <div className={`mt-4 rounded-2xl p-4 text-sm border ${
          result.status === "VERIFIED"
            ? "bg-secondary text-primary border-primary/30"
            : "bg-destructive/10 text-destructive border-destructive/30"
        }`}>
          <div className="flex items-center justify-between font-semibold">
            <span>{result.status === "VERIFIED" ? " Location Verified" : "Location could not be verified."}</span>
            <span className="text-xs uppercase px-2 py-0.5 rounded-md bg-background">
              {result.verificationMode}
            </span>
          </div>
          <p className="mt-1 text-xs opacity-90">
            Computed distance: <strong>{result.distanceMeters} meters</strong> (Threshold: {result.thresholdMeters}m).
          </p>
          <p className="mt-2 text-xs italic opacity-80 border-t border-current/20 pt-2">
            "{result.disclaimer}"
          </p>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button onClick={onClose} className="rounded-md bg-secondary px-5 py-2 text-sm font-medium hover:bg-secondary/80">
          Close
        </button>
      </div>
    </Modal>
  );
}
