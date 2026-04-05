/**
 * SmartBill Cloud REST API — emitere facturi.
 * @see https://api.smartbill.ro/
 */

const BASE = "https://ws.smartbill.ro/SBORO/api";

export function isSmartBillConfigured(): boolean {
  return !!(
    process.env.SMARTBILL_EMAIL?.trim() &&
    process.env.SMARTBILL_TOKEN?.trim() &&
    process.env.SMARTBILL_COMPANY_VAT_CODE?.trim()
  );
}

type SmartBillProduct = Record<string, string | number | boolean>;

export type IssueInvoiceInput = {
  clientName: string;
  clientVatCode: string;
  clientAddress: string;
  clientCity: string;
  clientCounty: string;
  clientCountry: string;
  clientEmail: string | null;
  clientIsCompany: boolean;
  /** Linie unică — ex. „Vello Premium — 1 lună” */
  productName: string;
  /** Total document (EUR), cu TVA inclus dacă firma e plătitoare de TVA */
  totalAmountEur: number;
  currency: string;
  issueDate: string;
  /** Text ajutător pe factură */
  mentions: string;
  /** Dacă true, include TVA pe produs conform env */
  companyChargesVat: boolean;
  taxName: string;
  taxPercentage: number;
  seriesName: string;
  measuringUnit: string;
  /** Trimitere automată PDF pe email la emitere (necesită SMTP configurat în SmartBill Cloud). */
  sendInvoiceEmail?: boolean;
};

type SmartBillApiResponse = {
  sbcResponse?: {
    errorText?: string;
    message?: string;
    number?: string;
    series?: string;
    url?: string;
  };
  errorText?: string;
};

function authHeader(): string {
  const user = process.env.SMARTBILL_EMAIL!.trim();
  const token = process.env.SMARTBILL_TOKEN!.trim();
  const b64 = Buffer.from(`${user}:${token}`, "utf8").toString("base64");
  return `Basic ${b64}`;
}

function sanitizeClientName(name: string): string {
  return name
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\p{L}\p{N}\s\-&.]/gu, "")
    .trim()
    .slice(0, 200);
}

/**
 * Emite o factură și opțional înregistrează încasarea cu cardul (plată online).
 */
export async function issueInvoice(
  input: IssueInvoiceInput
): Promise<{ ok: true; series: string; number: string } | { ok: false; error: string }> {
  if (!isSmartBillConfigured()) {
    return { ok: false, error: "SmartBill nu este configurat (lipsește env)." };
  }

  const companyVatCode = process.env.SMARTBILL_COMPANY_VAT_CODE!.trim();
  const vatPayer = input.companyChargesVat;

  const clientEmail = input.clientEmail?.trim() || undefined;
  const sendMail =
    input.sendInvoiceEmail === true &&
    !!clientEmail &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail);

  const products: SmartBillProduct[] = [];

  if (vatPayer) {
    products.push({
      name: input.productName.slice(0, 255),
      isDiscount: false,
      measuringUnitName: input.measuringUnit,
      currency: input.currency,
      quantity: 1,
      price: Math.round(input.totalAmountEur * 100) / 100,
      isTaxIncluded: true,
      taxName: input.taxName,
      taxPercentage: input.taxPercentage,
      isService: true,
      saveToDb: false,
    });
  } else {
    products.push({
      name: input.productName.slice(0, 255),
      isDiscount: false,
      measuringUnitName: input.measuringUnit,
      currency: input.currency,
      quantity: 1,
      price: Math.round(input.totalAmountEur * 100) / 100,
      isService: true,
      saveToDb: false,
    });
  }

  const body: Record<string, unknown> = {
    companyVatCode,
    client: {
      name: sanitizeClientName(input.clientName),
      vatCode: input.clientVatCode,
      address: input.clientAddress.trim().slice(0, 500),
      city: input.clientCity.trim().slice(0, 200),
      county: input.clientCounty.trim().slice(0, 200),
      country: input.clientCountry.trim().slice(0, 200),
      isTaxPayer: input.clientIsCompany,
      email: clientEmail,
      saveToDb: false,
    },
    issueDate: input.issueDate,
    seriesName: input.seriesName,
    currency: input.currency,
    language: "RO",
    precision: 2,
    isDraft: false,
    mentions: input.mentions.slice(0, 2000),
    products,
    payment: {
      value: Math.round(input.totalAmountEur * 100) / 100,
      type: "Card",
      isCash: false,
    },
  };

  if (sendMail) {
    body.sendEmail = true;
    body.email = { to: clientEmail };
  }

  try {
    const res = await fetch(`${BASE}/invoice`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: SmartBillApiResponse = {};
    try {
      json = JSON.parse(text) as SmartBillApiResponse;
    } catch {
      return { ok: false, error: `Răspuns SmartBill invalid (${res.status}): ${text.slice(0, 200)}` };
    }

    const resp = (json.sbcResponse ?? json) as {
      errorText?: string;
      series?: string;
      number?: string;
    };
    const err = resp.errorText?.trim();
    if (!res.ok || err) {
      return { ok: false, error: err || `HTTP ${res.status}` };
    }

    const series = resp.series?.trim();
    const number = resp.number?.trim();
    if (!series || !number) {
      return { ok: false, error: "SmartBill nu a returnat serie/număr factură." };
    }

    return { ok: true, series, number };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Eroare rețea SmartBill";
    return { ok: false, error: msg };
  }
}

export function getSmartBillEnvForInvoice(): {
  companyChargesVat: boolean;
  taxName: string;
  taxPercentage: number;
  seriesName: string;
  measuringUnit: string;
  /** Implicit true; setează SMARTBILL_SEND_INVOICE_EMAIL=false pentru a dezactiva. */
  sendInvoiceEmail: boolean;
} {
  const vatRaw = process.env.SMARTBILL_COMPANY_VAT_PAYER;
  const companyChargesVat = vatRaw !== "false" && vatRaw !== "0";
  const sendRaw = process.env.SMARTBILL_SEND_INVOICE_EMAIL;
  const sendInvoiceEmail = sendRaw !== "false" && sendRaw !== "0";
  return {
    companyChargesVat,
    taxName: process.env.SMARTBILL_TAX_NAME?.trim() || "Normala",
    taxPercentage: Number(process.env.SMARTBILL_TAX_PERCENTAGE ?? "21") || 21,
    seriesName: process.env.SMARTBILL_INVOICE_SERIES?.trim() || "FCT",
    measuringUnit: process.env.SMARTBILL_MEASURING_UNIT?.trim() || "buc",
    sendInvoiceEmail,
  };
}
