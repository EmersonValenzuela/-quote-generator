import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Plus,
  X,
} from "lucide-react";
import {
  Field,
  PageHeading,
} from "./page-heading";
import {
  formatDate,
  formatMoney,
  getTotals,
} from "./workspace-formatters";
import type {
  QuoteDocumentItem,
  QuoteDocumentModel,
} from "@/features/quotes/domain/quote-document-model";
import type { CustomerRow } from "./workspace-types";
import { calculateQuoteTotals } from "@/features/quotes/domain/calculate-quote-totals";

export function EditorScreen({
  model,
  title,
  isSaving,
  mobilePreview,
  onBack,
  onSave,
  onMobilePreview,
  onChange,
  onChangeItem,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  customers,
  onSelectCustomer,
}: {
  model: QuoteDocumentModel;
  title: string;
  isSaving: boolean;
  mobilePreview: boolean;
  onBack: () => void;
  onSave: () => void;
  onMobilePreview: (
    value: boolean,
  ) => void;
  onChange: <
    K extends keyof QuoteDocumentModel,
  >(
    key: K,
    value: QuoteDocumentModel[K],
  ) => void;
  onChangeItem: (
    itemId: string,
    key: keyof QuoteDocumentItem,
    value: string,
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (
    itemId: string,
  ) => void;
  onMoveItem: (
    itemId: string,
    direction: -1 | 1,
  ) => void;
  customers: CustomerRow[];
  onSelectCustomer: (
    customerId: string,
  ) => void;
}) {
  const totals = getTotals(model);

  return (
    <>
      <button
        className="back-link"
        onClick={onBack}
      >
        <ArrowLeft size={16} /> Volver a
        cotizaciones
      </button>
      <PageHeading
        eyebrow="BORRADOR"
        title={title}
        description="Completa los datos y revisa los importes antes de guardar."
      />
      <div
        className="mobile-editor-tabs"
        role="tablist"
        aria-label="Vista de cotización"
      >
        <button
          role="tab"
          aria-selected={!mobilePreview}
          className={
            !mobilePreview
              ? "selected"
              : ""
          }
          onClick={() =>
            onMobilePreview(false)
          }
        >
          Editar
        </button>
        <button
          role="tab"
          aria-selected={mobilePreview}
          className={
            mobilePreview
              ? "selected"
              : ""
          }
          onClick={() =>
            onMobilePreview(true)
          }
        >
          Vista previa
        </button>
      </div>
      <div className="editor-layout">
        <div
          className={`editor-form ${mobilePreview ? "mobile-hidden" : ""}`}
        >
          <section className="panel form-panel">
            <div className="form-section-heading">
              <span className="section-number">
                01
              </span>
              <div>
                <h2>Datos generales</h2>
                <p>
                  Identifica a quién y
                  qué estás cotizando.
                </p>
              </div>
            </div>
            <div className="form-grid">
              <Field
                label="Seleccionar cliente guardado"
                className="field-full"
              >
                <select
                  value={
                    model.customer.id ??
                    ""
                  }
                  onChange={(event) =>
                    onSelectCustomer(
                      event.target
                        .value,
                    )
                  }
                >
                  <option value="">
                    Sin vincular /
                    ingresar manualmente
                  </option>
                  {customers
                    .filter(
                      (customer) =>
                        customer.isActive,
                    )
                    .map((customer) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {customer.name}
                        {customer.documentNumber
                          ? ` · ${customer.documentNumber}`
                          : ""}
                      </option>
                    ))}
                </select>
              </Field>
              <Field
                label="Cliente"
                required
                className="field-full"
              >
                <input
                  value={
                    model.customer.name
                  }
                  onChange={(event) =>
                    onChange(
                      "customer",
                      {
                        ...model.customer,
                        id: null,
                        name: event
                          .target.value,
                      },
                    )
                  }
                  placeholder="Nombre o razón social"
                />
              </Field>
              <Field label="Documento">
                <input
                  value={
                    model.customer.taxId
                  }
                  onChange={(event) =>
                    onChange(
                      "customer",
                      {
                        ...model.customer,
                        taxId:
                          event.target
                            .value,
                      },
                    )
                  }
                  placeholder="RUC o DNI (opcional en borrador)"
                />
              </Field>
              <Field label="Fecha">
                <input
                  type="date"
                  value={
                    model.issueDate
                  }
                  onChange={(event) =>
                    onChange(
                      "issueDate",
                      event.target
                        .value,
                    )
                  }
                />
              </Field>
              <Field
                label="Servicio"
                required
                className="field-full"
              >
                <input
                  value={model.service}
                  onChange={(event) =>
                    onChange(
                      "service",
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ej. Fabricación e instalación"
                />
              </Field>
            </div>
          </section>

          <section className="panel form-panel">
            <div className="form-section-heading">
              <span className="section-number">
                02
              </span>
              <div>
                <h2>Conceptos</h2>
                <p>
                  Los precios unitarios
                  se ingresan sin IGV.
                </p>
              </div>
            </div>
            <div className="items-heading">
              <span>DESCRIPCIÓN</span>
              <span>CANTIDAD</span>
              <span>UNIDAD</span>
              <span>PRECIO BASE</span>
              <span />
            </div>
            <div className="editor-items">
              {model.items.map(
                (item, index) => (
                  <div
                    className="editor-item"
                    key={item.id}
                  >
                    <label className="item-description">
                      <span className="sr-only">
                        Descripción del
                        concepto{" "}
                        {index + 1}
                      </span>
                      <textarea
                        value={
                          item.description
                        }
                        onChange={(
                          event,
                        ) =>
                          onChangeItem(
                            item.id,
                            "description",
                            event.target
                              .value,
                          )
                        }
                        rows={2}
                        placeholder="Describe el producto o servicio"
                      />
                    </label>
                    <label className="item-quantity">
                      <span className="sr-only">
                        Cantidad del
                        concepto{" "}
                        {index + 1}
                      </span>
                      <input
                        type="number"
                        min="0.001"
                        max="9999999"
                        step="0.001"
                        value={
                          item.quantity
                        }
                        onChange={(
                          event,
                        ) =>
                          onChangeItem(
                            item.id,
                            "quantity",
                            event.target
                              .value,
                          )
                        }
                      />
                    </label>
                    <label className="item-unit">
                      <span className="sr-only">
                        Unidad del
                        concepto{" "}
                        {index + 1}
                      </span>
                      <select
                        value={
                          item.unit
                        }
                        onChange={(
                          event,
                        ) =>
                          onChangeItem(
                            item.id,
                            "unit",
                            event.target
                              .value,
                          )
                        }
                      >
                        {[
                          "UND",
                          "M",
                          "M²",
                          "KG",
                          "SERV",
                        ].map(
                          (unit) => (
                            <option
                              key={unit}
                            >
                              {unit}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label className="item-price">
                      <span className="sr-only">
                        Precio base del
                        concepto{" "}
                        {index + 1}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={
                          item.unitPrice
                        }
                        onChange={(
                          event,
                        ) =>
                          onChangeItem(
                            item.id,
                            "unitPrice",
                            event.target
                              .value,
                          )
                        }
                        placeholder="0.00"
                      />
                    </label>
                    <div className="item-controls">
                      <button
                        className="icon-button"
                        aria-label={`Mover concepto ${index + 1} arriba`}
                        disabled={
                          index === 0
                        }
                        onClick={() =>
                          onMoveItem(
                            item.id,
                            -1,
                          )
                        }
                      >
                        <ArrowUp
                          size={14}
                        />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Mover concepto ${index + 1} abajo`}
                        disabled={
                          index ===
                          model.items
                            .length -
                            1
                        }
                        onClick={() =>
                          onMoveItem(
                            item.id,
                            1,
                          )
                        }
                      >
                        <ArrowDown
                          size={14}
                        />
                      </button>
                      <button
                        className="icon-button remove-item"
                        aria-label={`Eliminar concepto ${index + 1}`}
                        disabled={
                          model.items
                            .length ===
                          1
                        }
                        onClick={() =>
                          onRemoveItem(
                            item.id,
                          )
                        }
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
            <button
              className="add-item-button"
              onClick={onAddItem}
            >
              <Plus size={16} /> Agregar
              concepto
            </button>
          </section>

          <section className="panel form-panel">
            <div className="form-section-heading">
              <span className="section-number">
                03
              </span>
              <div>
                <h2>Impuesto</h2>
                <p>
                  Esta selección se
                  aplica a toda la
                  cotización.
                </p>
              </div>
            </div>
            <div className="tax-options">
              <label
                className={`tax-option ${model.taxMode === "with-igv" ? "tax-option-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="tax-mode"
                  checked={
                    model.taxMode ===
                    "with-igv"
                  }
                  onChange={() =>
                    onChange(
                      "taxMode",
                      "with-igv",
                    )
                  }
                />
                <span>
                  <strong>
                    Con IGV
                  </strong>
                  <small>
                    Se agrega{" "}
                    {
                      model.appliedTaxRate
                    }{" "}
                    % al subtotal.
                  </small>
                </span>
                <span className="radio-indicator" />
              </label>
              <label
                className={`tax-option ${model.taxMode === "without-igv" ? "tax-option-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="tax-mode"
                  checked={
                    model.taxMode ===
                    "without-igv"
                  }
                  onChange={() =>
                    onChange(
                      "taxMode",
                      "without-igv",
                    )
                  }
                />
                <span>
                  <strong>
                    Sin IGV
                  </strong>
                  <small>
                    No se agrega
                    impuesto al
                    subtotal.
                  </small>
                </span>
                <span className="radio-indicator" />
              </label>
            </div>
            <p className="tax-explainer">
              Los precios ingresados son
              siempre precios base sin
              IGV. Al cambiar esta
              opción se recalcula el
              total desde el subtotal.
            </p>
          </section>

          <section className="panel form-panel">
            <div className="form-section-heading">
              <span className="section-number">
                04
              </span>
              <div>
                <h2>Especificaciones</h2>
                <p>
                  Opcional. Agrega materiales, acabados u otros detalles
                  técnicos que deban aparecer en la cotización.
                </p>
              </div>
            </div>
            <Field
              label="Especificaciones de materiales (opcional)"
              className="field-full"
            >
              <textarea
                rows={3}
                placeholder="Una especificación por línea"
                value={model.materials.join("\n")}
                onChange={(event) =>
                  onChange(
                    "materials",
                    event.target.value.split("\n").filter(Boolean),
                  )
                }
              />
            </Field>
          </section>

          <section className="panel form-panel">
            <div className="form-section-heading">
              <span className="section-number">
                05
              </span>
              <div>
                <h2>Condiciones comerciales</h2>
                <p>
                  Se incluyen en la cotización. Puedes ajustar estos textos
                  para cada cliente.
                </p>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Forma de pago">
                <input
                  value={
                    model.conditions
                      .payment
                  }
                  onChange={(event) =>
                    onChange(
                      "conditions",
                      {
                        ...model.conditions,
                        payment:
                          event.target
                            .value,
                      },
                    )
                  }
                  placeholder="Indica la forma de pago"
                />
              </Field>
              <Field label="Validez de la cotización">
                <input
                  value={
                    model.conditions
                      .validity
                  }
                  onChange={(event) =>
                    onChange(
                      "conditions",
                      {
                        ...model.conditions,
                        validity:
                          event.target
                            .value,
                      },
                    )
                  }
                  placeholder="Ej. 15 días calendario"
                />
              </Field>
              <Field
                label="Plazo de ejecución del servicio"
                className="field-full"
              >
                <input
                  value={
                    model.conditions
                      .execution
                  }
                  onChange={(event) =>
                    onChange(
                      "conditions",
                      {
                        ...model.conditions,
                        execution:
                          event.target
                            .value,
                      },
                    )
                  }
                  placeholder="Indica el plazo y desde cuándo se cuenta"
                />
              </Field>
            </div>
          </section>
          <div className="editor-actions">
            <button
              className="button button-secondary"
              onClick={onBack}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              className="button button-primary"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving
                ? "Guardando…"
                : "Guardar borrador"}{" "}
              {!isSaving && (
                <ArrowRight size={16} />
              )}
            </button>
          </div>
        </div>
        <div
          className={`preview-column ${mobilePreview ? "mobile-preview-active" : ""}`}
        >
          <div className="preview-heading">
            <div>
              <strong>
                Vista previa
              </strong>
              <span>
                Estimación · no es un
                PDF emitido
              </span>
            </div>
            <span className="preview-page-count">
              A4 · 1 pág. aprox.
            </span>
          </div>
          <QuotePreview
            model={model}
            totals={totals}
          />
          <p className="preview-disclaimer">
            La paginación y el diseño
            definitivos dependen del PDF
            generado desde una revisión
            guardada.
          </p>
        </div>
      </div>
    </>
  );
}

export function QuotePreview({
  model,
  totals,
}: {
  model: QuoteDocumentModel;
  totals: ReturnType<
    typeof calculateQuoteTotals
  > | null;
}) {
  return (
    <article className="quote-paper">
      <header className="paper-header">
        <svg
          className="paper-header-artwork"
          viewBox="0 0 595.28 140"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 0H595.28V38C540 17 504 16 458 29C397 45 359 28 303 24C226 18 169 34 110 29C66 25 31 21 0 36Z"
            fill="#b4becd"
          />
          <path
            d="M0 0H415C369 12 341 28 303 42C250 61 210 84 169 108C119 137 66 140 0 140Z"
            fill="#102b59"
          />
          <path
            d="M0 0H381C341 10 316 24 281 38C231 56 190 79 151 103C106 132 54 136 0 136Z"
            fill="#71819a"
          />
          <path
            d="M0 0H347C311 9 284 22 252 35C207 53 169 74 133 98C94 125 45 130 0 131Z"
            fill="#102b59"
          />
        </svg>
        <div className="paper-header-brand">
          <strong>
            MARCA PENDIENTE
          </strong>
          <small>
            BORRADOR · NO EMITIDA
          </small>
        </div>
        <div className="paper-header-company">
          <strong>
            {model.company.name ||
              "Nombre de empresa"}
          </strong>
          <small>
            {model.company.address ||
              "Dirección de empresa"}
          </small>
        </div>
      </header>
      <div className="paper-content">
        <div className="paper-date">
          Fecha:{" "}
          {formatDate(model.issueDate)}
        </div>
        <h2>COTIZACIÓN</h2>
        <p className="paper-subtitle">
          Borrador · Revisión 01
        </p>
        <div className="paper-parties">
          <div>
            <strong>CLIENTE</strong>
            <span>
              {model.customer.name ||
                "Nombre del cliente"}
            </span>
            <span>
              Documento:{" "}
              {model.customer.taxId ||
                "—"}
            </span>
          </div>
          <div>
            <strong>EMISOR</strong>
            <span>
              {model.company.name}
            </span>
            <span>
              RUC:{" "}
              {model.company.taxId ||
                "—"}
            </span>
          </div>
        </div>
        <div className="paper-service">
          <strong>SERVICIO</strong>
          <span>
            {model.service ||
              "Descripción del servicio"}
          </span>
        </div>
        <table className="paper-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cant.</th>
              <th>Unidad</th>
              <th>P. unitario</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {model.items.map(
              (item, index) => (
                <tr key={item.id}>
                  <td>
                    {item.description ||
                      `Concepto ${index + 1}`}
                  </td>
                  <td>
                    {item.quantity}
                  </td>
                  <td>{item.unit}</td>
                  <td>
                    {formatMoney(
                      Number(
                        item.unitPrice,
                      ) || 0,
                    )}
                  </td>
                  <td>
                    {formatMoney(
                      Number(
                        totals
                          ?.lineAmounts[
                          index
                        ] ?? 0,
                      ),
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {model.materials.length > 0 && (
          <div className="paper-specifications">
            <strong>ESPECIFICACIONES</strong>
            {model.materials.map((material) => (
              <span key={material}>• {material}</span>
            ))}
          </div>
        )}
        <div className="paper-totals">
          <div>
            <span>Subtotal</span>
            <span>
              {totals
                ? formatMoney(
                    totals.subtotal,
                  )
                : "—"}
            </span>
          </div>
          <div>
            <span>
              {model.taxMode ===
              "with-igv"
                ? `IGV (${model.appliedTaxRate} %)`
                : model.taxMode ===
                    "without-igv"
                  ? "IGV no incluido"
                  : "IGV pendiente de selección"}
            </span>
            <span>
              {totals
                ? formatMoney(
                    totals.taxAmount,
                  )
                : "—"}
            </span>
          </div>
          <strong>
            <span>
              {model.taxMode
                ? "TOTAL"
                : "SUBTOTAL PROVISIONAL"}
            </span>
            <span>
              {totals
                ? formatMoney(
                    totals.total,
                  )
                : "Completa cantidades y precios"}
            </span>
          </strong>
          {model.taxMode ===
            "without-igv" && (
            <small>
              COTIZACIÓN SIN IGV
            </small>
          )}
          {model.taxMode === null && (
            <small>
              Selecciona Con IGV o Sin
              IGV para determinar el
              total.
            </small>
          )}
        </div>
        <div className="paper-conditions">
          <strong>CONDICIONES COMERCIALES</strong>
          <span>Forma de pago: {model.conditions.payment}</span>
          <span>Validez de la cotización: {model.conditions.validity}</span>
          <span>
            Plazo de ejecución del servicio: {model.conditions.execution}
          </span>
        </div>
      </div>
      <footer className="paper-footer">
        <svg
          className="paper-footer-artwork"
          viewBox="0 0 595.28 75"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 28C58 30 95 19 146 10C207 -1 250 6 295 17C345 29 383 35 432 24C486 10 535 7 595.28 17V75H0Z"
            fill="#71819a"
          />
          <path
            d="M0 39C61 40 102 29 151 21C207 11 250 17 296 27C348 38 387 45 435 34C489 22 541 17 595.28 27V75H0Z"
            fill="#102b59"
          />
        </svg>
        <div className="paper-footer-content">
          <span>
            Previsualización de borrador
            · No válido como cotización
            emitida
          </span>
          <span>
            Importes sujetos a revisión
            antes de emitir
          </span>
        </div>
      </footer>
    </article>
  );
}
