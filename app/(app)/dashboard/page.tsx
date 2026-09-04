import type { Metadata } from "next";
import DashboardContent from "@/components/app/DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard — Movive",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
