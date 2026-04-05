import { LEGAL_LINKS } from "@/lib/company-legal";

const badgeBase =
  "footer-badge group flex min-h-[var(--touch-min)] flex-1 flex-col justify-center gap-0.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:border-white/25 hover:bg-white/[0.07]";

export function FooterLegalBadges() {
  return (
    <section
      className="footer-badges"
      aria-label="Instituții — informări și drepturi"
    >
      <p className="footer-badges-title">Informări pentru consumatori și protecția datelor</p>
      <div className="footer-badges-row">
        <a
          href={LEGAL_LINKS.anpc}
          target="_blank"
          rel="noopener noreferrer"
          className={badgeBase}
        >
          <span className="footer-badge-label">ANPC</span>
          <span className="footer-badge-desc">Autoritatea Națională pentru Protecția Consumatorilor</span>
        </a>
        <a
          href={LEGAL_LINKS.anpcComplaints}
          target="_blank"
          rel="noopener noreferrer"
          className={badgeBase}
        >
          <span className="footer-badge-label">Reclamație online</span>
          <span className="footer-badge-desc">Formular sesizare ANPC (eservicii.anpc.ro)</span>
        </a>
        <a
          href={LEGAL_LINKS.sal}
          target="_blank"
          rel="noopener noreferrer"
          className={badgeBase}
        >
          <span className="footer-badge-label">SAL</span>
          <span className="footer-badge-desc">Soluționarea alternativă a litigiilor</span>
        </a>
        <a
          href={LEGAL_LINKS.euConsumers}
          target="_blank"
          rel="noopener noreferrer"
          className={badgeBase}
        >
          <span className="footer-badge-label">Uniunea Europeană</span>
          <span className="footer-badge-desc">Drepturile consumatorilor (Your Europe)</span>
        </a>
        <a
          href={LEGAL_LINKS.anspdcp}
          target="_blank"
          rel="noopener noreferrer"
          className={badgeBase}
        >
          <span className="footer-badge-label">ANSPDCP</span>
          <span className="footer-badge-desc">Protecția datelor cu caracter personal</span>
        </a>
      </div>
    </section>
  );
}
