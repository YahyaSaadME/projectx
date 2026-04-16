"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PublicUser } from "@/lib/users";
import type { DashboardOrganization } from "@/lib/organizations";
import { Building2, LayoutDashboard, LayoutList, LogOut, Plus, Shield, UserCircle2, FileSpreadsheet, Inbox, Package } from "lucide-react";

type DashboardSidebarProps = {
  user: PublicUser;
  organizations: DashboardOrganization[];
};

const baseLink =
  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition border border-transparent";

function navClassName(active: boolean) {
  return `${baseLink} ${active ? "bg-white text-black" : "text-zinc-300 hover:border-white/10 hover:bg-white/5 hover:text-white"}`;
}

export default function DashboardSidebar({ user, organizations }: DashboardSidebarProps) {
  const pathname = usePathname();
  const organizationMatch = pathname.match(/\/dashboard\/organizations\/([a-f0-9]{24})(?:\/|$)/i);
  const activeOrganizationId = organizationMatch?.[1] ?? null;

  return (
    <aside className="border-b border-white/10 bg-black/90 px-4 py-5 md:min-h-screen md:border-b-0 md:border-r md:border-white/10">
      <div className="flex h-full flex-col gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Workspace</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Project X</h2>
          <p className="mt-2 text-sm text-zinc-400">{user.name}</p>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>

        <nav className="space-y-2">
          <div className="px-2 text-xs uppercase tracking-[0.3em] text-zinc-500">Pages</div>
          <Link className={navClassName(pathname === "/dashboard")} href="/dashboard">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </Link>
          <Link className={navClassName(pathname.includes("/dashboard/organizations/new"))} href="/dashboard/organizations/new">
            <Plus className="h-4 w-4" /> New organization
          </Link>
          <Link className={navClassName(pathname === "/profile")} href="/profile">
            <UserCircle2 className="h-4 w-4" /> Profile
          </Link>
        </nav>

        {activeOrganizationId ? (
          <nav className="space-y-2">
            <div className="px-2 text-xs uppercase tracking-[0.3em] text-zinc-500">Organization sections</div>
            <Link className={navClassName(pathname.endsWith(`/dashboard/organizations/${activeOrganizationId}`))} href={`/dashboard/organizations/${activeOrganizationId}`}>
              <LayoutList className="h-4 w-4" /> Overview
            </Link>
            <Link className={navClassName(pathname.includes(`/dashboard/organizations/${activeOrganizationId}/forms`))} href={`/dashboard/organizations/${activeOrganizationId}/forms`}>
              <FileSpreadsheet className="h-4 w-4" /> Manage forms
            </Link>
            <Link className={navClassName(pathname.endsWith(`/submissions`))} href={`/dashboard/organizations/${activeOrganizationId}/submissions`}>
              <Inbox className="h-4 w-4" /> Received data
            </Link>
            <Link className={navClassName(pathname.endsWith(`/warehouse`))} href={`/dashboard/organizations/${activeOrganizationId}/warehouse`}>
              <Package className="h-4 w-4" /> Warehouse
            </Link>
            <Link className={navClassName(pathname.includes(`/dashboard/organizations/${activeOrganizationId}/warehouse/products`))} href={`/dashboard/organizations/${activeOrganizationId}/warehouse/products`}>
              <FileSpreadsheet className="h-4 w-4" /> Products table
            </Link>
          </nav>
        ) : null}

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 px-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
            <Shield className="h-4 w-4" /> Your organizations
          </div>
          <div className="space-y-2">
            {organizations.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
                Create an organization to start publishing forms.
              </div>
            ) : null}
            {organizations.map((organization) => {
              const active = pathname.includes(`/dashboard/organizations/${organization._id}`);

              return (
                <Link
                  key={organization._id}
                  className={`${baseLink} flex-col items-start gap-1 ${active ? "bg-white text-black" : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"}`}
                  href={`/dashboard/organizations/${organization._id}`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{organization.name}</span>
                  </div>
                  <span className={`text-xs ${active ? "text-black/70" : "text-zinc-500"}`}>{organization.role}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <form action="/api/auth/logout" method="post">
          <button className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10" type="submit">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </form>
      </div>
    </aside>
  );
}