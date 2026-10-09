import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import {
  longDescriptionFixture,
  onePageFixture,
  threePageFixture,
} from "../src/features/quotes/documents/fixtures";
import type { QuoteDocumentModel } from "../src/features/quotes/domain/quote-document-model";
import type { PdfRenderer } from "../src/lib/pdf/pdf-renderer";
import { inspectPdf } from "../src/lib/pdf/inspect-pdf";
import { createChromiumPdfRenderer } from "../src/lib/pdf/renderers/chromium-renderer";
import { reactPdfRenderer } from "../src/lib/pdf/renderers/react-pdf-renderer";

const RENDER_COUNT = 10;
const outputDirectory = path.resolve("artifacts/pdf-comparison");

interface Fixture {
  fileName: string;
  model: QuoteDocumentModel;
  expectedPageCount?: number;
}

interface RunSummary {
  engine: string;
  rendererVersion: string;
  templateVersion: string;
  fixture: string;
  pageCount: number;
  fileSizeBytes: number;
  textSelectable: boolean;
  requiredTextPresent: boolean;
  firstRenderDurationMs: number;
  repeatDurationsMs: number[];
  nodeRssBeforeBytes: number;
  nodeRssAfterBytes: number;
}

const fixtures: Fixture[] = [
  { fileName: "one-page", model: onePageFixture, expectedPageCount: 1 },
  { fileName: "three-pages", model: threePageFixture, expectedPageCount: 3 },
  { fileName: "long-description", model: longDescriptionFixture },
];

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) * fraction)];
}

async function compareFixture(
  renderer: PdfRenderer,
  fixture: Fixture,
): Promise<RunSummary> {
  const durations: number[] = [];
  const pageCounts: number[] = [];
  let samplePdf: Uint8Array<ArrayBufferLike> = new Uint8Array();
  let sampleInspection: Awaited<ReturnType<typeof inspectPdf>> | undefined;
  let sampleSizeBytes = 0;
  const nodeRssBeforeBytes = process.memoryUsage.rss();

  for (let run = 0; run < RENDER_COUNT; run += 1) {
    const startedAt = performance.now();
    const pdf = await renderer.render(fixture.model);
    durations.push(Number((performance.now() - startedAt).toFixed(2)));

    const inspection = await inspectPdf(pdf);
    pageCounts.push(inspection.pageCount);

    if (run === 0) {
      samplePdf = pdf;
      sampleSizeBytes = pdf.byteLength;
      sampleInspection = inspection;
    }
  }

  const nodeRssAfterBytes = process.memoryUsage.rss();
  const expectedPageCount = fixture.expectedPageCount;
  const finalPageCount = pageCounts[0];

  if (
    pageCounts.some((pageCount) => pageCount !== finalPageCount) ||
    (expectedPageCount !== undefined && finalPageCount !== expectedPageCount)
  ) {
    throw new Error(
      `${renderer.engine}/${fixture.fileName}: páginas inestables o inesperadas (${pageCounts.join(", ")}).`,
    );
  }

  if (!sampleInspection) {
    throw new Error(`No se pudo inspeccionar ${renderer.engine}/${fixture.fileName}.`);
  }

  const requiredTextPresent =
    sampleInspection.text.includes(fixture.model.quoteNumber) &&
    sampleInspection.text.includes("COTIZACIÓN") &&
    sampleInspection.text.includes("TOTAL") &&
    sampleInspection.pageTexts.every(
      (page) => page.includes("Descripción") && page.includes("Página"),
    );

  if (!requiredTextPresent) {
    throw new Error(`Texto requerido ausente en ${renderer.engine}/${fixture.fileName}.`);
  }

  const engineDirectory = path.join(outputDirectory, renderer.engine);
  await mkdir(engineDirectory, { recursive: true });
  await writeFile(
    path.join(engineDirectory, `${fixture.fileName}.pdf`),
    samplePdf,
  );

  return {
    engine: renderer.engine,
    rendererVersion: renderer.rendererVersion,
    templateVersion: renderer.templateVersion,
    fixture: fixture.fileName,
    pageCount: finalPageCount,
    fileSizeBytes: sampleSizeBytes,
    textSelectable: true,
    requiredTextPresent,
    firstRenderDurationMs: durations[0],
    repeatDurationsMs: durations.slice(1),
    nodeRssBeforeBytes,
    nodeRssAfterBytes,
  };
}

async function main(): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });
  const chromiumRenderer = createChromiumPdfRenderer();
  const renderers = [reactPdfRenderer, chromiumRenderer];
  const summaries: RunSummary[] = [];

  try {
    for (const renderer of renderers) {
      for (const fixture of fixtures) {
        summaries.push(await compareFixture(renderer, fixture));
      }
    }
  } finally {
    await chromiumRenderer.close();
  }

  const environment = {
    date: new Date().toISOString(),
    nodeVersion: process.version,
    platform: `${process.platform}-${process.arch}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    totalMemoryBytes: os.totalmem(),
    renderCountPerFixtureAndEngine: RENDER_COUNT,
    note: "RSS mide el proceso Node, no la memoria separada de Chromium.",
  };

  await writeFile(
    path.join(outputDirectory, "results.json"),
    JSON.stringify({ environment, summaries }, null, 2),
    "utf8",
  );

  console.table(
    summaries.map((summary) => ({
      engine: summary.engine,
      fixture: summary.fixture,
      pages: summary.pageCount,
      bytes: summary.fileSizeBytes,
      firstMs: summary.firstRenderDurationMs,
      repeatP50Ms: percentile(summary.repeatDurationsMs, 0.5),
    })),
  );
  console.log(`PDF sintéticos guardados en ${outputDirectory}`);
}

main().catch((error: unknown) => {
  console.error("Falló la comparación de motores PDF.", error);
  process.exitCode = 1;
});
