import type { Metadata } from "next";
import Wizard from "@/components/onboarding/Wizard";
import Logo from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Welcome — Movive",
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      {/* Logo — full Movive lockup */}
      <div className="fixed left-6 top-6">
        <Logo variant="isologo" className="h-7" priority />
      </div>

      <Wizard />
    </div>
  );
}
