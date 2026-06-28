"use client";

const DOC_TYPES = [
  { id: "dt-1", name: "Facturi emise" },
  { id: "dt-2", name: "Extrase bancare" },
  { id: "dt-3", name: "Bonuri fiscale" },
];

type Props = {
  uploadCount: number;
  uploadedFiles: string[];
  spvPhase: "idle" | "typing" | "connecting" | "connected";
  spvCif: string;
};

export function DemoUploadScene({ uploadCount, uploadedFiles, spvPhase, spvCif }: Props) {
  const visibleFiles = uploadedFiles.slice(-4).reverse();

  return (
    <main className="min-h-full flex flex-col items-center justify-start px-4 py-8 bg-[var(--paper)] overflow-y-auto">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--sage)] mb-2">Upload documente</p>
          <h1 className="font-[var(--f-display)] text-2xl font-semibold text-[var(--ink)] tracking-tight mb-2">
            Trimite documente
          </h1>
          <p className="text-[var(--ink-soft)] text-sm">
            Pentru <strong className="text-[var(--ink)]">Demo Construct SRL</strong>.
          </p>
          <p className="text-xs text-[var(--ink-muted)] mt-2">
            Trimiți către: <strong className="text-[var(--ink-soft)]">Maria Contabilă</strong>
          </p>
        </div>

        <div className="bg-white rounded-[var(--r-xl)] border border-[var(--paper-3)] shadow-[var(--shadow-md)] overflow-hidden" data-demo="upload-card">
          <div className="px-4 py-3 border-b border-[var(--paper-3)] bg-[var(--paper)] flex items-center gap-2 text-sm">
            <span className="text-[var(--ink-muted)]">Documente pentru</span>
            <span className="font-medium text-[var(--ink)]">Iulie 2026</span>
          </div>

          <div className="divide-y divide-[var(--paper-3)]">
            {DOC_TYPES.map((dt, idx) => {
              const countForType = idx === 0 ? Math.min(uploadCount, 120) : idx === 1 ? Math.min(Math.max(uploadCount - 120, 0), 60) : Math.max(uploadCount - 180, 0);
              return (
                <div key={dt.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-semibold text-[var(--ink)] text-sm">{dt.name}</span>
                    {countForType > 0 && (
                      <span className="text-xs text-[var(--sage)] font-medium">✓ {countForType} fișiere</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      data-demo={idx === 0 ? "upload-btn" : undefined}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--r-sm)] text-sm font-medium bg-[var(--sage)] text-white"
                    >
                      Poză / fișier normal
                    </button>
                  </div>
                  {idx === 0 && visibleFiles.length > 0 && (
                    <ul className="mt-3 space-y-1.5 max-h-[140px] overflow-hidden">
                      {visibleFiles.map((name) => (
                        <li
                          key={name}
                          className="flex items-center gap-2 text-xs bg-[var(--paper)] border border-[var(--paper-3)] rounded-[var(--r-sm)] px-2.5 py-1.5"
                        >
                          <span className="text-[var(--ink)] truncate">{name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {spvPhase !== "idle" && (
          <div data-demo="spv-card" className="mt-5">
            {spvPhase === "connected" ? (
              <div className="rounded-[var(--r-lg)] border border-[var(--sage-light)] bg-[var(--sage-xlight)] p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sage)] text-white text-sm font-bold">✓</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">SPV e-Factura conectat</p>
                    <p className="text-sm text-[var(--ink-soft)] mt-1">
                      Facturile din SPV pentru CUI <strong>{spvCif}</strong> apar automat la contabil.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--r-lg)] border border-[var(--paper-3)] bg-white p-5 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--sage)] mb-1">Opțional — e-Factura SPV</p>
                <h2 className="font-[var(--f-display)] text-lg font-semibold text-[var(--ink)] mb-2">Conectează SPV e-Factura</h2>
                <p className="text-sm text-[var(--ink-soft)] mb-4">
                  Autorizează accesul la facturile din SPV — contabilul le vede automat în Vello.
                </p>
                <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1.5">CUI firmă</label>
                <input
                  type="text"
                  readOnly
                  value={spvCif}
                  data-demo="spv-cif-input"
                  className="w-full rounded-[var(--r-md)] border border-[var(--paper-3)] px-3 py-2.5 text-sm mb-3"
                />
                <button
                  type="button"
                  data-demo="spv-connect-btn"
                  className={`w-full rounded-[var(--r-md)] px-4 py-3 text-sm font-semibold text-white ${
                    spvPhase === "connecting" ? "bg-[var(--sage-dark)] opacity-80" : "bg-[var(--sage)]"
                  }`}
                >
                  {spvPhase === "connecting" ? "Se conectează la ANAF…" : "Conectează SPV"}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[var(--ink-muted)]">
          Vel<em className="text-[var(--sage)] not-italic font-semibold">lo</em>
        </p>
      </div>
    </main>
  );
}
