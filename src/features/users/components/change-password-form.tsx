"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { changeTemporaryPassword } from "@/features/users/server/change-password.action";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (newPassword !== confirmation) {
      setMessage("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changeTemporaryPassword({ currentPassword, newPassword });
      setMessage(result.message);
      if (result.success) {
        router.replace("/login");
        router.refresh();
      }
    } catch {
      setMessage("No se pudo completar el cambio. Inténtalo de nuevo o contacta al administrador.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="change-password-title">
        <div className="login-brand">
          <span className="brand-symbol">T</span>
          <span><strong>Cotizador</strong><small>SISTEMA DE COTIZACIONES</small></span>
        </div>
        <div className="login-heading">
          <span className="login-icon"><KeyRound size={19} /></span>
          <p className="page-eyebrow">SEGURIDAD DE LA CUENTA</p>
          <h1 id="change-password-title">Cambia tu contraseña</h1>
          <p>Por seguridad, reemplaza la contraseña temporal antes de continuar.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label className="field"><span>Contraseña temporal</span><input type="password" autoComplete="current-password" required minLength={12} maxLength={128} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label className="field"><span>Nueva contraseña</span><input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          <label className="field"><span>Confirma la nueva contraseña</span><input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
          <p className="password-guidance">Usa al menos 12 caracteres. La contraseña temporal debe ser distinta de la nueva.</p>
          {message && <p className="login-error" role="status">{message}</p>}
          <button className="button button-primary login-submit" disabled={isSubmitting} type="submit">{isSubmitting ? "Actualizando…" : "Actualizar contraseña"} {!isSubmitting && <ArrowRight size={16} />}</button>
        </form>
        <p className="login-recovery">Al actualizarla se cerrará esta sesión y tendrás que ingresar de nuevo.</p>
      </section>
    </main>
  );
}
