import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { rupees, normalizeProperty } from "@/lib/staylocal";
import { listAdminHosts, updateAdminHostStatus, listAdminProperties, updateAdminPropertyStatus } from "@/lib/api/admin";
import { listBookings } from "@/lib/api/bookings";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — StayLocal" },
      { name: "description", content: "Approve hosts and listings, and review StayLocal activity." },
      { property: "og:title", content: "Admin — StayLocal" },
      { property: "og:description", content: "Approve hosts and listings, and review StayLocal activity." },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Hosts", "Properties", "Bookings"] as const;

function AdminPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Hosts");
  const enabled = role === "admin";

  const hosts = useQuery({
    queryKey: ["admin-hosts"],
    enabled,
    queryFn: async () => {
      return await listAdminHosts();
    },
  });

  const properties = useQuery({
    queryKey: ["admin-props"],
    enabled,
    queryFn: async () => {
      const list = await listAdminProperties();
      return list.map(normalizeProperty);
    },
  });

  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    enabled,
    queryFn: async () => {
      return await listBookings();
    },
  });

  if (!enabled) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-xl font-semibold text-destructive">Admin access required</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please log in as an administrator to access the moderation console.
        </p>
      </div>
    );
  }

  async function setHost(hostId: string, status: "APPROVED" | "REJECTED") {
    try {
      await updateAdminHostStatus(hostId, status);
      toast.success(`Host ${status.toLowerCase()} successfully`);
      qc.invalidateQueries({ queryKey: ["admin-hosts"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update host status");
    }
  }

  async function setProp(id: string, status: "APPROVED" | "REJECTED" | "INACTIVE") {
    try {
      await updateAdminPropertyStatus(id, status);
      toast.success(`Listing ${status.toLowerCase()} successfully`);
      qc.invalidateQueries({ queryKey: ["admin-props"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update property status");
    }
  }

  const Actions = ({ onA, onR }: { onA: () => void; onR: () => void }) => (
    <div className="flex gap-2">
      <button
        onClick={onA}
        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        Approve
      </button>
      <button
        onClick={onR}
        className="rounded-full border border-destructive px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
      >
        Reject
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-primary font-bold">Admin Moderation Console</h1>
      <p className="text-sm text-muted-foreground mt-1">Review hosts, approve listings, and observe real-time system activity.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Hosts Pending / Registered", hosts.data?.length],
          ["Properties Total", properties.data?.length],
          ["Bookings Recorded", bookings.data?.length],
        ].map(([label, val]) => (
          <div key={label as string} className="surface-card rounded-2xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-3xl font-bold text-primary mt-1">{val ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {tab === "Hosts" &&
          hosts.data?.map((h) => (
            <Row
              key={h.id}
              left={
                <div>
                  <p className="font-semibold">{h.displayName}</p>
                  <p className="text-xs text-muted-foreground">ID: {h.id}</p>
                </div>
              }
              mid={
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  h.approvalStatus === "APPROVED" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {h.approvalStatus}
                </span>
              }
              right={
                <Actions
                  onA={() => setHost(h.id, "APPROVED")}
                  onR={() => setHost(h.id, "REJECTED")}
                />
              }
            />
          ))}

        {tab === "Properties" &&
          properties.data?.map((p) => (
            <Row
              key={p.id}
              left={
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.location} · {rupees(p.price_per_night)}/night</p>
                </div>
              }
              mid={
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  p.status === "APPROVED" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {p.status} · {p.location_verified ? "📍 Verified" : "Unverified"}
                </span>
              }
              right={
                <Actions
                  onA={() => setProp(p.id, "APPROVED")}
                  onR={() => setProp(p.id, "REJECTED")}
                />
              }
            />
          ))}

        {tab === "Bookings" &&
          bookings.data?.map((b: any) => (
            <Row
              key={b.id}
              left={
                <div>
                  <p className="font-semibold">{b.propertyTitle || "Stay Reservation"}</p>
                  <p className="text-xs text-muted-foreground">Booking ID: {b.id}</p>
                </div>
              }
              mid={
                <span>
                  {b.checkIn} → {b.checkOut} ({b.nightCount} nights)
                </span>
              }
              right={
                <span className="font-semibold text-primary">
                  {rupees(b.total)} · <span className="uppercase text-xs">{b.status}</span>
                </span>
              }
            />
          ))}
      </div>
    </div>
  );
}

function Row({ left, mid, right }: { left: ReactNode; mid: ReactNode; right: ReactNode }) {
  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-sm border border-border">
      <div className="min-w-[180px]">{left}</div>
      <div className="text-muted-foreground">{mid}</div>
      <div>{right}</div>
    </div>
  );
}
