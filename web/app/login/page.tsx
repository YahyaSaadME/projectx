import { Suspense } from "react";
import LoginPanel from "@/components/login-panel";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#080808]" />}>
      <LoginPanel />
    </Suspense>
  );
}