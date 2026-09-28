import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/lib/api/client";
import { getMe } from "@/lib/api/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const token = getStoredToken();
    if (!token) {
      throw redirect({ to: "/auth", search: { mode: "signin", role: "tourist" } });
    }
    try {
      const user = await getMe();
      return { user };
    } catch {
      throw redirect({ to: "/auth", search: { mode: "signin", role: "tourist" } });
    }
  },
  component: () => <Outlet />,
});
