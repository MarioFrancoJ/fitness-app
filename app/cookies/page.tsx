import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — Movive",
  description:
    "How Movive uses cookies and similar technologies to keep you signed in and remember your preferences.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return <LegalPage doc="cookies" />;
}
