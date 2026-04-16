import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getCurrentUser } from "@/lib/session";
import { listUserOrganizations } from "@/lib/organizations";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const organizations = await listUserOrganizations(user.id);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#2b2b2b,_#111111_40%,_#080808_100%)] text-zinc-400">
      <div className="md:grid md:grid-cols-[320px_1fr]">
        <DashboardSidebar user={user} organizations={organizations} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}