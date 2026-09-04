import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — FitnessApp",
  description:
    "How FitnessApp uses cookies and similar technologies to keep you signed in and remember your preferences.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return <LegalPage doc="cookies" />;
}
