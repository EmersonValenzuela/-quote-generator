import { useState } from "react";
import { Building2, FileText, UsersRound, X } from "lucide-react";
import { saveCompanySettings } from "@/features/customers/server/customer.actions";
import { Field, PageHeading } from "./page-heading";
import type { CompanySettingsModel } from "./workspace-types";

export function SettingsScreen({
  settings,
  canEdit,
  onSaved,
}: {
  settings: CompanySettingsModel;
  canEdit: boolean;
  onSaved: (settings: CompanySettingsModel) => void;
}) {
  const [form, setForm] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    try {
      const result = await saveCompanySettings(form);
      setNotice(result.message);
      if (result.success) onSaved(form);
    } catch {
      setNotice("No se pudo guardar la configuración por un problema de conexión.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeading eyebrow="TU NEGOCIO" title="Configuración" description="Administra los datos que aparecerán en tus cotizaciones." />
      {notice && <div className="inline-notice" role="status"><span>{notice}</span><button aria-label="Cerrar mensaje" onClick={() => setNotice("")}><X size={15} /></button></div>}
      <div className="settings-layout">
        <nav className="panel settings-nav" aria-label="Secciones de configuración"><button className="settings-nav-active" aria-current="page"><Building2 size={17} /> Datos de empresa</button><button disabled title="La gestión de usuarios todavía no está disponible."><UsersRound size={17} /> Usuarios y acceso</button><button disabled title="La configuración de plantilla todavía no está disponible."><FileText size={17} /> Plantilla y condiciones</button></nav>
        <form className="panel settings-panel" onSubmit={(event) => void saveSettings(event)}>
          <div className="form-section-heading"><span className="settings-heading-icon"><Building2 size={17} /></span><div><h2>Datos de empresa</h2><p>Esta información se mostrará en las cotizaciones nuevas.</p></div></div>
          <div className="form-grid">
            <Field label="Nombre comercial"><input required maxLength={200} value={form.tradeName} disabled={!canEdit} onChange={(event) => setForm({ ...form, tradeName: event.target.value })} /></Field><Field label="Razón social"><input maxLength={200} value={form.legalName} disabled={!canEdit} onChange={(event) => setForm({ ...form, legalName: event.target.value })} /></Field><Field label="RUC"><input maxLength={30} value={form.taxId} disabled={!canEdit} onChange={(event) => setForm({ ...form, taxId: event.target.value })} /></Field><Field label="Teléfono"><input maxLength={40} value={form.phone} disabled={!canEdit} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field><Field label="Correo electrónico"><input type="email" value={form.email} disabled={!canEdit} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Dirección" className="field-full"><input maxLength={500} value={form.address} disabled={!canEdit} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
          </div>
          <div className="settings-divider" />
          <div className="form-section-heading"><span className="settings-heading-icon"><FileText size={17} /></span><div><h2>Preferencias de cotización</h2><p>La tasa y vigencia se guardan en la base de datos.</p></div></div>
          <div className="form-grid"><Field label="Moneda"><select value="PEN" disabled><option value="PEN">Sol peruano (PEN)</option></select></Field><Field label="Tasa de IGV"><div className="input-suffix"><input type="number" value={form.taxRate} min="0" max="100" step="0.01" disabled={!canEdit} onChange={(event) => setForm({ ...form, taxRate: event.target.value })} /><span>%</span></div></Field><Field label="Vigencia predeterminada"><div className="input-suffix"><input type="number" value={form.defaultValidityDays} min="1" max="365" disabled={!canEdit} onChange={(event) => setForm({ ...form, defaultValidityDays: Number(event.target.value) })} /><span>días</span></div></Field></div>
          <div className="settings-actions"><span>{canEdit ? "Solo el administrador puede modificar estos datos." : "Contacta al administrador para modificar la configuración."}</span><button className="button button-primary" disabled={!canEdit || isSaving}>{isSaving ? "Guardando…" : "Guardar configuración"}</button></div>
        </form>
      </div>
    </>
  );
}
