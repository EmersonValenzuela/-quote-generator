import type { QuoteDocumentModel } from "@/features/quotes/domain/quote-document-model";

const syntheticCompany = {
  name: "EMPRESA FICTICIA DE PRUEBA",
  taxId: "00000000000",
  address: "Dirección de ejemplo · Lima, Perú",
  phone: "(000) 000-000",
  bankDetails: "Sin cuenta real · Datos bancarios omitidos",
};

const syntheticCustomer = {
  name: "Cliente de prueba · Datos ficticios",
  taxId: "00000000000",
  address: "Dirección de prueba, Lima",
  contact: "Contacto de ejemplo",
};

function createBaseModel(
  quoteNumber: string,
  taxMode: QuoteDocumentModel["taxMode"],
): QuoteDocumentModel {
  return {
    quoteNumber,
    revisionNumber: 1,
    issueDate: "2026-10-07",
    taxMode,
    appliedTaxRate: "18",
    company: syntheticCompany,
    customer: syntheticCustomer,
    service: "Fabricación e instalación · Ejemplo sintético",
    items: [],
    materials: [
      "Materiales de prueba, no corresponden a un pedido real.",
      "Acabado de ejemplo para validar saltos de línea y paginación.",
    ],
    conditions: {
      payment: "Condición de pago de ejemplo.",
      validity: "Vigencia de prueba: 15 días.",
      execution: "Plazo de ejecución referencial, sin compromiso comercial.",
    },
  };
}

export const onePageFixture: QuoteDocumentModel = {
  ...createBaseModel("MUESTRA-1P", "with-igv"),
  items: [
    {
      id: "1",
      description: "Diseño y preparación de planos técnicos con revisión incluida.",
      quantity: "2",
      unit: "SERV",
      unitPrice: "250",
    },
    {
      id: "2",
      description: "Fabricación de estructura metálica a medida, con uniones reforzadas.",
      quantity: "1",
      unit: "UND",
      unitPrice: "200",
    },
    {
      id: "3",
      description: "Suministro de perfiles de aluminio anodizado.",
      quantity: "0.5",
      unit: "M",
      unitPrice: "40.25",
    },
    {
      id: "4",
      description:
        "Instalación, nivelación y limpieza final. Incluye coordinación de acceso al lugar.",
      quantity: "3",
      unit: "SERV",
      unitPrice: "93.29",
    },
  ],
};

export const threePageFixture: QuoteDocumentModel = {
  ...createBaseModel("MUESTRA-3P", "without-igv"),
  items: Array.from({ length: 56 }, (_, index) => ({
    id: `partida-${index + 1}`,
    description:
      `Partida ${String(index + 1).padStart(2, "0")}: fabricación e instalación de componente ` +
      "metálico de prueba, con acabado uniforme, fijaciones incluidas y revisión de medidas.",
    quantity: index % 3 === 0 ? "1.5" : "1",
    unit: index % 3 === 0 ? "M" : "UND",
    unitPrice: "29.95",
  })),
};

const longDescription = [
  "INICIO-DESCRIPCION-EXTENSA-Ñ. Texto sintético para comprobar la continuidad de una celda que ocupa más de una página.",
  ...Array.from(
    { length: 220 },
    (_, index) =>
      `Párrafo ${String(index + 1).padStart(3, "0")}: revisión de materiales, medidas y acabados en el ejemplo ficticio número ${index + 1}. ` +
      "Este contenido repetido verifica que las tildes, los saltos y el texto seleccionable no se pierdan entre páginas.",
  ),
  "FIN-DESCRIPCION-EXTENSA-ÁÉÍÓÚ. Fin de la descripción larga sintética.",
].join("\n\n");

export const longDescriptionFixture: QuoteDocumentModel = {
  ...createBaseModel("MUESTRA-TEXTO-LARGO", "with-igv"),
  items: [
    {
      id: "descripcion-extensa",
      description: longDescription,
      quantity: "1",
      unit: "SERV",
      unitPrice: "1000",
    },
  ],
};
