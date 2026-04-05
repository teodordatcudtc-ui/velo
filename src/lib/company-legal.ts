/** Date identificare operator — PFA software (Vello). Actualizează la schimbări legale. */
export const COMPANY_LEGAL = {
  name: "DATCU TEODOR ANDREI PERSOANĂ FIZICĂ AUTORIZATĂ",
  shortName: "Datcu Teodor Andrei PFA",
  addressLines: [
    "Jud. Ilfov, Loc. Popești Leordeni, Oraș Popești Leordeni",
    "Strada Biruintei, Nr. 51-57, Bl. 4, Scara 1, Etaj 5, Ap. 80",
  ],
  cui: "54376137",
  cuiDate: "30.03.2026",
  caen: "6210",
  caenLabel:
    "Activități de realizare a soft-ului la comandă (software orientat client)",
  email: "teodordatcu29@gmail.com",
  phoneE164: "+40762444577",
  phoneDisplay: "0762 444 577",
} as const;

export const LEGAL_LINKS = {
  /** Autoritatea Națională pentru Protecția Consumatorilor */
  anpc: "https://www.anpc.ro/",
  /** Formular reclamații / sesizări online ANPC */
  anpcComplaints: "https://eservicii.anpc.ro/",
  /**
   * SAL — soluționare alternativă a litigiilor (România).
   * Platforma UE ODR a fost închisă (iulie 2025); pentru litigii se folosesc mecanismele naționale și ghidurile UE actualizate.
   */
  sal: "https://reclamatiisal.anpc.ro/",
  /** Drepturile consumatorilor — portal UE (Your Europe) */
  euConsumers: "https://europa.eu/youreurope/citizens/consumers/index_ro.htm",
  /** Autoritatea națională de supraveghere a prelucrării datelor cu caracter personal */
  anspdcp: "https://www.dataprotection.ro/",
} as const;

export function companyAddressBlock(): string {
  return [COMPANY_LEGAL.name, ...COMPANY_LEGAL.addressLines].join("\n");
}
