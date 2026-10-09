import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/features/users/components/change-password-form";
import { getAuth } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Cambiar contraseña | Sistema de cotizaciones",
  description: "Actualiza tu contraseña temporal para continuar.",
};

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (!session.user.isActive) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/");

  return <ChangePasswordForm />;
}
