import type { Metadata } from "next";
import DashboardContent from "@/components/app/DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard — FitnessApp",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
