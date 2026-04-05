import { isValidCounty } from "@/lib/ro-counties";

export type BillingPayload = {
  legalName: string;
  vatCode: string;
  address: string;
  city: string;
  county: string;
  country: string;
  email: string;
  isCompany: boolean;
};

export function normalizeVatCode(raw: string, isCompany: boolean): string {
  const t = raw.replace(/\s+/g, "").trim();
  if (!isCompany) {
    if (t.length === 0) return "0";
    return t;
  }
  return t.toUpperCase().startsWith("RO") ? t.toUpperCase() : `RO${t.replace(/^RO/i, "")}`;
}

export function validateBillingPayload(p: BillingPayload): string | null {
  const name = p.legalName?.trim();
  if (!name || name.length < 2) return "Completează denumirea sau numele complet.";

  const vat = p.vatCode?.trim();
  if (!vat) {
    return p.isCompany
      ? "Completează CIF-ul."
      : "Completează CNP-ul sau 0 conform politicii de facturare.";
  }

  if (p.isCompany) {
    const digits = vat.replace(/\s/g, "").replace(/^RO/i, "");
    if (!/^\d{2,10}$/.test(digits)) return "CIF invalid (folosește cifre, opțional prefix RO).";
  } else {
    const clean = vat.replace(/\s/g, "");
    if (clean !== "-" && clean !== "0" && !/^0+$/.test(clean) && !/^\d{13}$/.test(clean)) {
      return "Pentru persoane fizice: CNP valid (13 cifre), sau 0, sau -.";
    }
  }

  const addr = p.address?.trim();
  if (!addr || addr.length < 3) return "Completează adresa.";

  const city = p.city?.trim();
  if (!city || city.length < 2) return "Completează localitatea.";

  const county = p.county?.trim();
  if (!county) return "Alege județul.";
  if (!isValidCounty(county)) return "Județ invalid. Alege din listă.";

  const country = p.country?.trim() || "România";
  if (country.length < 2) return "Completează țara.";

  const email = p.email?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Adresa de e-mail pentru factură nu este validă.";
  }

  return null;
}

/** Verificare rapidă pentru rând `accountants` înainte de Stripe. */
export function isBillingRowComplete(row: {
  billing_legal_name: string | null;
  billing_vat_code: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_county: string | null;
  billing_country: string | null;
}): boolean {
  return !!(
    row.billing_legal_name?.trim() &&
    row.billing_vat_code?.trim() &&
    row.billing_address?.trim() &&
    row.billing_city?.trim() &&
    row.billing_county?.trim() &&
    row.billing_country?.trim()
  );
}
