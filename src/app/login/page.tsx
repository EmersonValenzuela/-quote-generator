import type { Metadata } from "next";
import { LoginForm } from "@/features/users/components/login-form";

export const metadata: Metadata = {
  title: "Acceso | Cotizador familiar",
  description: "Acceso privado al cotizador familiar.",
};

export default function LoginPage() {
  return <LoginForm />;
}
