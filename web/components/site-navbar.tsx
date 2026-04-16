import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { BadgeCheck, CalendarClock, LayoutDashboard, ShieldUser, Users } from "lucide-react";

export default async function SiteNavbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-white uppercase" href="/">
          <ShieldUser className="h-4 w-4" /> Sales Orchestrator
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Link className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white" href="/dashboard">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white" href="/dashboard/organizations/new">
            <Users className="h-4 w-4" /> Organizations
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white" href="/dashboard">
            <CalendarClock className="h-4 w-4" /> Reminders
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white" href="/dashboard">
            <BadgeCheck className="h-4 w-4" /> Agent rules
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? <span className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 md:inline-flex">{user.name}</span> : null}
          <div className="flex items-center gap-2">
            {user ? (
              <Link className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200" href="/dashboard">
                Open app
              </Link>
            ) : (
              <>
                <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white" href="/login">
                  Login
                </Link>
                <Link className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200" href="/signup">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}