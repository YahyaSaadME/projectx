import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { CircleUserRound } from "lucide-react";

export default async function SiteNavbar() {
  const user = await getCurrentUser();

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "LP";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <Link className="text-lg font-semibold tracking-wide text-white" href={user ? "/dashboard" : "/"}>
            Project X
          </Link>
          <p className="truncate text-xs text-zinc-400">Forms, submissions, and secure authentication.</p>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-zinc-100">{user.name}</p>
              <p className="max-w-44 truncate text-xs text-zinc-500">{user.email}</p>
            </div>
          ) : (
            <p className="hidden max-w-56 text-right text-xs text-zinc-500 sm:block">Sign in with email/password or Google OAuth.</p>
          )}

        {user ? (
          <Link
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
            href="/profile"
            aria-label={`Open profile for ${user.name}`}
            title={user.name}
          >
            {initials}
          </Link>
        ) : (
          <Link
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
            href="/login"
            aria-label="Login"
            title="Login"
          >
            <CircleUserRound className="h-5 w-5" />
          </Link>
        )}
        </div>
      </div>
    </header>
  );
}