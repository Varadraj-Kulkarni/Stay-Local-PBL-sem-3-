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
import { initUpload, uploadFileBytes } from "@/lib/api/media";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-primary">Host dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Host verification: <span className="rounded-full bg-secondary px-3 py-0.5 text-primary font-medium">Verified Local Host</span>
          </p>
        </div>
        <button
          onClick={() => setForm(empty)}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95"
        >
          + Add property
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total Listings" value={listings.data?.length ?? 0} />
        <Stat label="Total Reservations" value={bookings.data?.length ?? 0} />
        <Stat
          label="Total Booked Value"
          value={rupees((bookings.data ?? []).reduce((s: number, b: Booking) => s + Number(b.total), 0))}
        />
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Your listings</h2>
      {listings.data?.length === 0 && <p className="mt-2 text-muted-foreground">No listings yet — add your first room.</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {listings.data?.map((p) => (
          <div key={p.id} className="surface-card overflow-hidden rounded-2xl border border-border">
            <img src={p.photos[0]} alt={p.name} className="h-44 w-full object-cover" />
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <span className={`rounded-full px-3 py-0.5 text-xs font-medium uppercase ${
                  p.status === "APPROVED" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {p.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {p.location} · {rupees(p.price_per_night)}/night
              </p>
              <p className="text-sm font-medium">
                {p.location_verified ? (
                  <span className="text-primary font-semibold">📍 Location Verified</span>
                ) : (
                  <span className="text-muted-foreground">Location not verified yet</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  className="rounded-full border border-border px-3.5 py-1 text-sm font-medium hover:border-primary transition-colors"
                  onClick={() =>
                    setForm({
                      id: p.id,
                      name: p.name,
                      destinationId: "dest-lonavala",
                      location: p.location,
                      description: p.description,
                      price_per_night: p.price_per_night,
                      max_guests: 2,
                      amenities: p.amenities,
                      photos: p.photos.join("\n"),
                      latitude: p.latitude?.toString() ?? "",
                      longitude: p.longitude?.toString() ?? "",
                      available_from: p.available_from ?? "",
                      available_to: p.available_to ?? "",
                    })
                  }
                >
                  Edit
                </button>
                <button
                  className="rounded-full border border-primary bg-primary/5 px-3.5 py-1 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => setVerifying(p)}
                >
                  Verify location (Camera+GPS)
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Reservations & Guests</h2>
      <div className="mt-4 space-y-2">
        {(bookings.data ?? []).length === 0 && <p className="text-muted-foreground">No bookings recorded yet.</p>}
        {bookings.data?.map((b: Booking) => (
          <div key={b.id} className="surface-card flex flex-wrap justify-between items-center gap-2 rounded-xl p-3.5 text-sm border border-border">
            <span>
              <strong>{b.propertyTitle}</strong> · Guest ({b.guests} guests)
            </span>
            <span className="text-muted-foreground">
              {b.checkIn} → {b.checkOut} ({b.nightCount} nights) · <strong className="text-foreground">{rupees(b.total)}</strong> ·{" "}
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold uppercase">{b.status}</span>
            </span>
          </div>
        ))}
      </div>

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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
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
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
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
          📍 Use current device coordinates
        </button>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
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
        toast.success(`📍 Location Verified! (${res.distanceMeters}m from registered address)`);
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
          <img src={photoPreview} alt="Captured room" className="max-h-48 rounded-xl object-cover shadow-soft" />
        ) : (
          <div className="space-y-1">
            <span className="text-3xl block">📷</span>
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
            🛰️ Live GPS
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runVerification("SIMULATED_AT_PROPERTY")}
            className="rounded-xl border border-border bg-card py-2 text-xs font-semibold hover:border-primary disabled:opacity-50"
          >
            ✅ Simulate: At Property
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runVerification("SIMULATED_AWAY")}
            className="rounded-xl border border-border bg-card py-2 text-xs font-semibold hover:border-destructive text-destructive disabled:opacity-50"
          >
            ❌ Simulate: 2km Away
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
            <span>{result.status === "VERIFIED" ? "📍 Location Verified" : "Location could not be verified."}</span>
            <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-background/80">
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
        <button onClick={onClose} className="rounded-full bg-secondary px-5 py-2 text-sm font-medium hover:bg-secondary/80">
          Close
        </button>
      </div>
    </Modal>
  );
}
