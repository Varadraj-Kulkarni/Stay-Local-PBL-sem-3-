import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { rupees, normalizeProperty } from "@/lib/staylocal";
import { listAdminHosts, updateAdminHostStatus, listAdminProperties, updateAdminPropertyStatus } from "@/lib/api/admin";
import { listBookings } from "@/lib/api/bookings";

import { Shield, CheckCircle2, AlertTriangle, Users, Building, Calendar, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — StayLocal" },
      { name: "description", content: "Approve hosts and listings, and review StayLocal activity." },
      { property: "og:title", content: "Admin Console — StayLocal" },
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
        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
      >
        Approve
      </button>
      <button
        onClick={onR}
        className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors shadow-xs"
      >
        Reject
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-primary to-emerald-950 p-6 sm:p-8 text-primary-foreground shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            <Shield className="size-3.5" /> Platform Security & Verification
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Admin Moderation Console
          </h1>
          <p className="text-sm text-white/80 max-w-xl leading-relaxed">
            Verify newly submitted rural homestay listings, review host onboarding requests, and audit real-time guest booking activity.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card rounded-2xl p-5 border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Hosts</span>
            <div className="size-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Users className="size-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">{hosts.data?.length ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Total active & pending hosts</p>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Homestays</span>
            <div className="size-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Building className="size-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">{properties.data?.length ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Live & submitted listings</p>
        </div>

        <div className="surface-card rounded-2xl p-5 border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
            <div className="size-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Calendar className="size-5" />
            </div>
          </div>
          <p className="font-display text-3xl font-bold text-foreground mt-2">{bookings.data?.length ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Confirmed guest stays</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border/80 gap-6 text-sm font-semibold">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3.5 transition-colors border-b-2 ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t} ({t === "Hosts" ? hosts.data?.length ?? 0 : t === "Properties" ? properties.data?.length ?? 0 : bookings.data?.length ?? 0})
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
                <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase ${
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
                <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  p.status === "APPROVED" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {p.status} · {p.location_verified ? " Verified" : "Unverified"}
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
