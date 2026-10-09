import type { Metadata } from "next";
import { LoginForm } from "@/features/users/components/login-form";

export const metadata: Metadata = {
  title: "Acceso | Sistema de cotizaciones",
  description: "Acceso privado al sistema de cotizaciones.",
};

export default function LoginPage() {
  return <LoginForm />;
}
