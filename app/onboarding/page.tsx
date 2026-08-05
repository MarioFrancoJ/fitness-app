import type { Metadata } from "next";
import Wizard from "@/components/onboarding/Wizard";

export const metadata: Metadata = {
  title: "Welcome — FitnessApp",
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      {/* Logo */}
      <div className="fixed left-6 top-6">
        <span className="text-base font-bold tracking-tight text-zinc-900">
          FitnessApp
        </span>
      </div>

      <Wizard />
    </div>
  );
}
