let counter = 0;

export function uniquePhone(): string {
  counter += 1;
  const millis = Date.now().toString().slice(-3);
  const seq = counter.toString().padStart(6, "0");
  return `9${millis}${seq}`;
}

export function uniqueName(prefix: string): string {
  counter += 1;
  // Includes a timestamp, not just the counter — the counter alone repeats
  // the same values on every run (1, 2, 3, ...) in the same call order, which
  // collides with leftover rows from earlier runs against a DB that isn't
  // reset between manual re-runs (it IS reset by global-setup's db push +
  // seed for schema, but that doesn't delete existing data rows).
  return `${prefix} ${Date.now()}${counter}`;
}

export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}@e2e.test`;
}
