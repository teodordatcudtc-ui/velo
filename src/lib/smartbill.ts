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
  /** Total document (sumă majoră), cu TVA inclus dacă firma e plătitoare de TVA */
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
  Fault?: { errorText?: string; message?: string };
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

/** Extrage serie/număr sau mesaj de eroare din răspuns JSON SmartBill (inclusiv `Fault`). */
function parseSmartBillResponse(
  text: string,
  httpStatus: number
): { ok: true; series: string; number: string } | { ok: false; error: string } {
  let json: SmartBillApiResponse;
  try {
    json = JSON.parse(text) as SmartBillApiResponse;
  } catch {
    return { ok: false, error: `Răspuns invalid (${httpStatus}): ${text.slice(0, 280)}` };
  }

  const faultErr = json.Fault?.errorText?.trim();
  if (faultErr) {
    return { ok: false, error: faultErr };
  }

  const inner = (json.sbcResponse ?? json) as {
    errorText?: string;
    series?: string;
    number?: string;
  };
  const errMsg = inner.errorText?.trim();
  if (errMsg) {
    return { ok: false, error: errMsg };
  }

  const series = inner.series?.trim();
  const number = inner.number?.trim();

  if (series && number) {
    return { ok: true, series, number };
  }

  if (httpStatus >= 400) {
    return { ok: false, error: `HTTP ${httpStatus}: ${text.slice(0, 280)}` };
  }

  return {
    ok: false,
    error: `SmartBill nu a returnat serie/număr (HTTP ${httpStatus}). Răspuns: ${text.slice(0, 400)}`,
  };
}

function buildProducts(input: IssueInvoiceInput): SmartBillProduct[] {
  const vatPayer = input.companyChargesVat;
  const price = Math.round(input.totalAmountEur * 100) / 100;
  if (vatPayer) {
    return [
      {
        name: input.productName.slice(0, 255),
        isDiscount: false,
        measuringUnitName: input.measuringUnit,
        currency: input.currency,
        quantity: 1,
        price,
        isTaxIncluded: true,
        taxName: input.taxName,
        taxPercentage: input.taxPercentage,
        isService: true,
        saveToDb: false,
      },
    ];
  }
  return [
    {
      name: input.productName.slice(0, 255),
      isDiscount: false,
      measuringUnitName: input.measuringUnit,
      currency: input.currency,
      quantity: 1,
      price,
      isService: true,
      saveToDb: false,
    },
  ];
}

function buildInvoiceBody(
  input: IssueInvoiceInput,
  options: { includePayment: boolean; sendEmail: boolean }
): Record<string, unknown> {
  const companyVatCode = process.env.SMARTBILL_COMPANY_VAT_CODE!.trim();
  const clientEmail = input.clientEmail?.trim() || undefined;
  const sendMail =
    options.sendEmail &&
    !!clientEmail &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail);

  const price = Math.round(input.totalAmountEur * 100) / 100;

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
    products: buildProducts(input),
  };

  if (options.includePayment) {
    body.payment = {
      value: price,
      type: "Card",
      isCash: false,
    };
  }

  if (sendMail && clientEmail) {
    body.sendEmail = true;
    body.email = { to: clientEmail };
  }

  return body;
}

async function postInvoice(
  body: Record<string, unknown>
): Promise<{ httpStatus: number; text: string }> {
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
  return { httpStatus: res.status, text };
}

export type IssueInvoiceResult =
  | { ok: true; series: string; number: string; note?: string }
  | { ok: false; error: string };

/**
 * Emite factura SmartBill. Reîncearcă fără încasare la emitere și/sau fără email dacă primul apel eșuează
 * (tipic: nepotrivire TVA/total la încasare, SMTP neconfigurat).
 */
export async function issueInvoice(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
  if (!isSmartBillConfigured()) {
    return { ok: false, error: "SmartBill nu este configurat (lipsește env)." };
  }

  const wantEmail = input.sendInvoiceEmail === true;

  const attempts: Array<{ includePayment: boolean; sendEmail: boolean; label: string }> = wantEmail
    ? [
        { includePayment: true, sendEmail: true, label: "încasare automată + email" },
        { includePayment: false, sendEmail: true, label: "fără încasare automată (factură + email)" },
        { includePayment: false, sendEmail: false, label: "fără încasare, fără email" },
      ]
    : [
        { includePayment: true, sendEmail: false, label: "încasare automată" },
        { includePayment: false, sendEmail: false, label: "fără încasare automată" },
      ];

  let lastError = "Eroare necunoscută";

  for (const att of attempts) {
    const body = buildInvoiceBody(input, {
      includePayment: att.includePayment,
      sendEmail: att.sendEmail,
    });

    try {
      const { httpStatus, text } = await postInvoice(body);
      const parsed = parseSmartBillResponse(text, httpStatus);

      if (parsed.ok) {
        const note =
          att.label !== attempts[0]?.label
            ? `Emitere reușită (${att.label}). Adaugă încasarea manual în SmartBill dacă e nevoie.`
            : undefined;
        return { ok: true, series: parsed.series, number: parsed.number, note };
      }

      lastError = parsed.error;

      if (httpStatus === 401) {
        return { ok: false, error: lastError };
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Eroare rețea SmartBill";
    }
  }

  return { ok: false, error: lastError };
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
