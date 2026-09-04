import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — FitnessApp",
  description:
    "How FitnessApp collects, uses and protects your workout, nutrition and progress data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
