import { useState } from "react";
import { Plus, Search, UsersRound, X } from "lucide-react";
import { createCustomer, setCustomerActive, updateCustomer } from "@/features/customers/server/customer.actions";
import { Field, PageHeading } from "./page-heading";
import type { CustomerRow } from "./workspace-types";

export function CustomersScreen({
  customers,
  onCustomersChange,
}: {
  customers: CustomerRow[];
  onCustomersChange: (customers: CustomerRow[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    name: "",
    documentType: "" as "" | "RUC" | "DNI",
    documentNumber: "",
    address: "",
    contactName: "",
    email: "",
    phone: "",
  });
  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.documentType ?? ""} ${customer.documentNumber ?? ""} ${customer.contactName}`
      .toLocaleLowerCase("es")
      .includes(search.trim().toLocaleLowerCase("es")),
  );

  async function saveNewCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    try {
      const input = {
        ...form,
        documentType: form.documentType || null,
      };
      const result = editingCustomerId
        ? await updateCustomer(editingCustomerId, input)
        : await createCustomer(input);
      if (!result.success) {
        setNotice(result.message);
        return;
      }
      onCustomersChange(
        editingCustomerId
          ? customers.map((customer) =>
              customer.id === result.customer.id
                ? { ...customer, ...result.customer }
                : customer,
            )
          : [{ ...result.customer }, ...customers],
      );
      setForm({
        name: "",
        documentType: "",
        documentNumber: "",
        address: "",
        contactName: "",
        email: "",
        phone: "",
      });
      setShowForm(false);
      setEditingCustomerId(null);
      setNotice(editingCustomerId ? "Cambios del cliente guardados." : "Cliente guardado correctamente.");
    } catch {
      setNotice("No se pudo guardar el cliente por un problema de conexión. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  }

  function editCustomer(customer: CustomerRow) {
    setEditingCustomerId(customer.id);
    setForm({
      name: customer.name,
      documentType:
        customer.documentType === "RUC" || customer.documentType === "DNI"
          ? customer.documentType
          : "",
      documentNumber: customer.documentNumber ?? "",
      address: customer.address,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
    });
    setShowForm(true);
    setNotice("");
  }

  async function toggleCustomer(customer: CustomerRow) {
    setNotice("");
    try {
      const result = await setCustomerActive(customer.id, !customer.isActive);
      if (!result.success) {
        setNotice(result.message);
        return;
      }
      onCustomersChange(
        customers.map((current) =>
          current.id === customer.id
            ? { ...current, isActive: result.customer.isActive }
            : current,
        ),
      );
      setNotice(result.customer.isActive ? "Cliente activado." : "Cliente desactivado.");
    } catch {
      setNotice("No se pudo actualizar el cliente por un problema de conexión.");
    }
  }

  return (
    <>
      <PageHeading eyebrow="CONTACTOS" title="Clientes" description="Administra los clientes guardados en la base de datos." action={<button className="button button-primary" onClick={() => { setShowForm((current) => !current); setEditingCustomerId(null); setNotice(""); }}><Plus size={17} /> {showForm ? "Cerrar formulario" : "Nuevo cliente"}</button>} />
      {notice && <div className="inline-notice" role="status"><span>{notice}</span><button aria-label="Cerrar mensaje" onClick={() => setNotice("")}><X size={15} /></button></div>}
      {showForm && (
        <form className="panel settings-panel" onSubmit={(event) => void saveNewCustomer(event)}>
          <div className="form-section-heading"><span className="settings-heading-icon"><UsersRound size={17} /></span><div><h2>{editingCustomerId ? "Editar cliente" : "Nuevo cliente"}</h2><p>El nombre es obligatorio; los demás datos pueden completarse después.</p></div></div>
          <div className="form-grid">
            <Field label="Nombre o razón social"><input required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
            <Field label="Tipo de documento"><select value={form.documentType} onChange={(event) => setForm({ ...form, documentType: event.target.value as "" | "RUC" | "DNI" })}><option value="">Sin especificar</option><option value="RUC">RUC</option><option value="DNI">DNI</option></select></Field>
            <Field label="Número de documento"><input maxLength={30} value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} /></Field>
            <Field label="Persona de contacto"><input maxLength={200} value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} /></Field>
            <Field label="Teléfono"><input maxLength={40} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
            <Field label="Correo electrónico"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
            <Field label="Dirección" className="field-full"><input maxLength={500} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
          </div>
          <div className="settings-actions"><span>Los datos se guardarán en PostgreSQL.</span><button className="button button-primary" disabled={isSaving}>{isSaving ? "Guardando…" : editingCustomerId ? "Guardar cambios" : "Guardar cliente"}</button></div>
        </form>
      )}
      <section className="panel customer-panel">
        <div className="panel-header"><div><h2>Directorio de clientes</h2><p>{filteredCustomers.length} clientes guardados</p></div><label className="search-field customer-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente" aria-label="Buscar cliente" /></label></div>
        {filteredCustomers.length ? <div className="table-scroll"><table className="quotes-table customers-table"><thead><tr><th>CLIENTE</th><th>DOCUMENTO</th><th>CONTACTO</th><th>COTIZACIONES</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead><tbody>{filteredCustomers.map((customer) => <tr key={customer.id}><td><span className="customer-cell">{customer.name}</span></td><td>{customer.documentType ? `${customer.documentType} · ` : ""}{customer.documentNumber || "—"}</td><td>{customer.contactName || "—"}<small className="table-subline">{customer.phone}</small></td><td>{customer.quoteCount}</td><td><span className={`status-badge ${customer.isActive ? "status-aceptada" : "status-rechazada"}`}>{customer.isActive ? "Activo" : "Inactivo"}</span></td><td><button className="button button-secondary" onClick={() => editCustomer(customer)}>Editar</button> <button className="button button-secondary" onClick={() => void toggleCustomer(customer)}>{customer.isActive ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table></div> : <div className="empty-state"><span className="empty-icon"><Search size={22} /></span><h3>{customers.length ? "No encontramos clientes" : "Aún no hay clientes"}</h3><p>{customers.length ? "Prueba con otro término de búsqueda." : "Agrega tu primer cliente para conservar sus datos."}</p></div>}
      </section>
      <p className="screen-footnote">Los clientes desactivados se conservan para el historial y no se eliminan.</p>
    </>
  );
}
