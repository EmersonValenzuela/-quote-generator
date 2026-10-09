"use client";

import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe: true,
        callbackURL: "/",
      });

      if (result.error) {
        setErrorMessage("No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMessage("No se pudo conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-symbol">T</span>
          <span><strong>Taller Familiar</strong><small>COTIZADOR</small></span>
        </div>
        <div className="login-heading">
          <span className="login-icon"><KeyRound size={19} /></span>
          <p className="page-eyebrow">ESPACIO PRIVADO</p>
          <h1 id="login-title">Bienvenido de nuevo</h1>
          <p>Ingresa con la cuenta que te proporcionó el administrador.</p>
        </div>

        <form className="login-form" onSubmit={signIn}>
          <label className="field">
            <span>Correo electrónico</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@ejemplo.com"
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}

          <button className="button button-primary login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando…" : "Iniciar sesión"} {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="login-recovery"><ShieldCheck size={15} /> ¿Olvidaste tu contraseña? Contacta al administrador. No enviamos correos.</p>
        <p className="login-footnote">Acceso privado · No hay registro público</p>
      </section>
    </main>
  );
}
