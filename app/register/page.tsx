import type { Metadata } from "next";
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account — FitnessApp",
  description: "Create your free FitnessApp account and start your fitness journey today.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      headline="Start Your Journey"
      description="Join thousands of athletes and coaches already transforming their fitness with FitnessApp."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
