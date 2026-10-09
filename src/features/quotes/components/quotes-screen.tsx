import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Download,
  FilePlus2,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { PageHeading } from "./page-heading";
import { formatDate, formatMoney, StatusBadge } from "./workspace-formatters";
import type { QuoteRow } from "./workspace-types";

export function QuotesScreen({
  quotes,
  allQuotes,
  search,
  statusFilter,
  loadingQuoteId,
  onSearch,
  onStatusFilter,
  onCreate,
  onOpen,
}: {
  quotes: QuoteRow[];
  allQuotes: QuoteRow[];
  search: string;
  statusFilter: string;
  loadingQuoteId: string | null;
  onSearch: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onCreate: () => void;
  onOpen: (quote: QuoteRow) => void;
}) {
  const sentTotal = allQuotes.filter((quote) => quote.status === "Enviada").length;
  const draftTotal = allQuotes.filter((quote) => quote.status === "Borrador").length;
  const acceptedTotal = allQuotes.filter((quote) => quote.status === "Aceptada").length;

  return (
    <>
      <PageHeading
        eyebrow="RESUMEN DEL TRABAJO"
        title="Cotizaciones"
        description="Crea y edita borradores guardados de forma persistente."
        action={<button className="button button-primary" onClick={onCreate}><Plus size={17} /> Nueva cotización</button>}
      />

      <section className="summary-grid" aria-label="Resumen de cotizaciones">
        <SummaryCard label="Total de cotizaciones" value={String(allQuotes.length).padStart(2, "0")} note="En todos los estados" icon={<FileText size={18} />} tone="blue" />
        <SummaryCard label="Por responder" value={String(sentTotal).padStart(2, "0")} note="Esperando respuesta" icon={<Clock3 size={18} />} tone="amber" />
        <SummaryCard label="Borradores" value={String(draftTotal).padStart(2, "0")} note="Aún no emitidos" icon={<FilePlus2 size={18} />} tone="slate" />
        <SummaryCard label="Aceptadas" value={String(acceptedTotal).padStart(2, "0")} note="Registradas manualmente" icon={<Check size={18} />} tone="green" />
      </section>

      <section className="panel quote-list-panel" aria-labelledby="recent-quotes-title">
        <div className="panel-header">
          <div><h2 id="recent-quotes-title">Todas las cotizaciones</h2><p>{quotes.length} de {allQuotes.length} documentos</p></div>
          <button className="button button-secondary export-button" disabled title="La exportación se habilitará al conectar los datos persistentes.">Exportar <ChevronDown size={15} /></button>
        </div>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar número, cliente o servicio" aria-label="Buscar cotizaciones" />
            {search && <button aria-label="Limpiar búsqueda" onClick={() => onSearch("")}><X size={14} /></button>}
          </label>
          <label className="filter-select">
            <span className="sr-only">Filtrar por estado</span>
            <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}>
              {["Todos", "Borrador", "Enviada", "Aceptada", "Rechazada"].map((option) => <option key={option}>{option}</option>)}
            </select>
            <ChevronDown size={15} />
          </label>
        </div>
        {quotes.length ? (
          <div className="table-scroll">
            <table className="quotes-table">
              <thead><tr><th scope="col">NÚMERO</th><th scope="col">CLIENTE</th><th scope="col">SERVICIO</th><th scope="col">FECHA</th><th scope="col">TOTAL</th><th scope="col">ESTADO</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} aria-busy={loadingQuoteId === quote.id} onClick={() => { if (loadingQuoteId !== quote.id) onOpen(quote); }} tabIndex={0} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && loadingQuoteId !== quote.id) onOpen(quote); }}>
                    <td><button className="quote-number" disabled={loadingQuoteId === quote.id} onClick={(event) => { event.stopPropagation(); onOpen(quote); }}>{loadingQuoteId === quote.id ? "Abriendo…" : quote.number}</button></td>
                    <td><span className="customer-cell">{quote.customer}</span></td>
                    <td className="service-cell">{quote.service}</td>
                    <td className="date-cell">{formatDate(quote.issueDate)}</td>
                    <td className="amount-cell">{formatMoney(quote.total)}{quote.taxMode === null && <small>Subtotal provisional</small>}</td>
                    <td><StatusBadge status={quote.status} /></td>
                    <td className="quote-actions-cell">
                      <a
                        className="table-more icon-button"
                        href={`/api/quotes/drafts/${encodeURIComponent(quote.id)}/pdf`}
                        aria-label={`Descargar PDF de ${quote.number}`}
                        title="Descargar PDF del borrador guardado"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Download size={17} />
                      </a>
                      <button className="table-more icon-button" aria-label={`Abrir ${quote.number}`} disabled={loadingQuoteId === quote.id} onClick={(event) => { event.stopPropagation(); onOpen(quote); }}><MoreHorizontal size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon"><Search size={22} /></span>
            <h3>{allQuotes.length === 0 ? "Aún no hay borradores" : "No encontramos cotizaciones"}</h3>
            <p>{allQuotes.length === 0 ? "Crea una cotización nueva; podrás volver a editarla después de guardarla." : "Prueba con otro término o limpia el filtro para ver todos los documentos."}</p>
            {allQuotes.length === 0
              ? <button className="button button-primary" onClick={onCreate}><Plus size={16} /> Crear borrador</button>
              : <button className="button button-secondary" onClick={() => { onSearch(""); onStatusFilter("Todos"); }}>Limpiar búsqueda</button>}
          </div>
        )}
        <div className="table-footer"><span>Mostrando {quotes.length ? 1 : 0}–{quotes.length} de {quotes.length} resultados</span><div><button disabled aria-label="Página anterior"><ArrowLeft size={15} /></button><span className="current-page">1</span><button disabled aria-label="Página siguiente"><ArrowRight size={15} /></button></div></div>
      </section>
      <p className="screen-footnote">Descarga el PDF desde el icono de descarga; será una previsualización marcada como borrador y no cambiará su estado. La emisión y el registro de respuestas aún no están disponibles.</p>
    </>
  );
}

function SummaryCard({ label, value, note, icon, tone }: { label: string; value: string; note: string; icon: React.ReactNode; tone: string }) {
  return (
    <article className="summary-card">
      <div className={`summary-icon summary-${tone}`}>{icon}</div>
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
      <div className="summary-note">{note}</div>
    </article>
  );
}
