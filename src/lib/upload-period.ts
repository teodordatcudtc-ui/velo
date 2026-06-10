export const UPLOAD_PERIOD_MONTHS_BACK = 2;

const MONTH_NAMES_RO = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
] as const;

export type UploadPeriod = { month: number; year: number };

export function periodKey(period: UploadPeriod): string {
  return `${period.year}-${period.month}`;
}

export function formatUploadPeriodLabel(month: number, year: number): string {
  const name = MONTH_NAMES_RO[(month - 1) % 12] ?? `Luna ${month}`;
  return `${name} ${year}`;
}

/** Luna curentă + ultimele `monthsBack` luni (inclusiv curenta). */
export function buildSelectableUploadPeriods(
  monthsBack = UPLOAD_PERIOD_MONTHS_BACK,
  now = new Date()
): UploadPeriod[] {
  const out: UploadPeriod[] = [];
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  for (let i = 0; i <= monthsBack; i++) {
    out.push({ month, year });
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }
  return out;
}

export function parseUploadPeriodInput(
  monthRaw: unknown,
  yearRaw: unknown,
  monthsBack = UPLOAD_PERIOD_MONTHS_BACK,
  now = new Date()
): { ok: true; period: UploadPeriod } | { ok: false; error: string } {
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, error: "Luna selectată nu este validă." };
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { ok: false, error: "Anul selectat nu este valid." };
  }

  const allowed = new Set(
    buildSelectableUploadPeriods(monthsBack, now).map((p) => periodKey(p))
  );
  if (!allowed.has(periodKey({ month, year }))) {
    return { ok: false, error: "Perioada selectată nu este disponibilă." };
  }

  return { ok: true, period: { month, year } };
}
