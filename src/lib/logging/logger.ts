import "server-only";

type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, string | number | boolean | null>;

export function logEvent(
  level: LogLevel,
  event: string,
  fields: LogFields = {},
): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  });

  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.info(entry);
  }
}
