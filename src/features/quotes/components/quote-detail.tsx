import { ArrowLeft, CircleHelp, Clock3, FilePlus2, FileText } from "lucide-react";
import { PageHeading } from "./page-heading";
import { formatDate, formatMoney, StatusBadge } from "./workspace-formatters";
import type { QuoteRow } from "./workspace-types";

export function QuoteDetail({ quote, onBack, onEdit }: { quote: QuoteRow; onBack: () => void; onEdit: () => void }) {
  return (
    <>
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Volver a cotizaciones</button>
      <PageHeading eyebrow="DOCUMENTO · VISTA DE DEMOSTRACIÓN" title={quote.number} description={`${quote.customer} · ${quote.service}`} action={<button className="button button-primary" onClick={onEdit}><FilePlus2 size={16} /> Nuevo borrador</button>} />
      <section className="detail-layout">
        <div className="panel detail-summary">
          <div className="detail-status-row"><StatusBadge status={quote.status} /><span className="revision-label">Revisión 01</span></div>
          <div className="detail-total"><span>Total de cotización</span><strong>{formatMoney(quote.total)}</strong><small>{quote.taxMode === "with-igv" ? "Con IGV" : "Sin IGV · no agregado"}</small></div>
          <dl className="detail-facts"><div><dt>Fecha</dt><dd>{formatDate(quote.issueDate)}</dd></div><div><dt>Cliente</dt><dd>{quote.customer}</dd></div><div><dt>Servicio</dt><dd>{quote.service}</dd></div></dl>
          <div className="detail-callout"><CircleHelp size={17} /><span>Los datos de esta vista son de muestra. Emisión, revisiones y descarga estarán disponibles al conectar persistencia y generación documental.</span></div>
        </div>
        <div className="panel history-panel"><div className="panel-header"><div><h2>Actividad</h2><p>Historial de esta cotización</p></div></div><div className="history-entry"><span className="history-icon"><FileText size={16} /></span><div><strong>Registro sintético para la demostración</strong><span>{formatDate(quote.issueDate)} · No es un evento comercial</span></div></div><div className="history-entry"><span className="history-icon"><Clock3 size={16} /></span><div><strong>Estado solo ilustrativo</strong><span>No se ha enviado ni aceptado ningún documento</span></div></div></div>
      </section>
    </>
  );
}
