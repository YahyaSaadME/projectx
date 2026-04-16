"use client";

import { Globe2 } from "lucide-react";

type GoogleOAuthButtonProps = {
  mode: "login" | "signup";
};

export default function GoogleOAuthButton({ mode }: GoogleOAuthButtonProps) {
  function handleClick() {
    window.location.href = `/api/auth/google/start?mode=${mode}`;
  }

  return (
    <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-white/10" type="button" onClick={handleClick}>
      <Globe2 className="h-4 w-4" /> Continue with Google
    </button>
  );
}