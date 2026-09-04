import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Movive",
  description:
    "The terms that govern your use of Movive, including acceptable use and the not-medical-advice disclaimer.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
