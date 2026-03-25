import Link from "next/link";
import PricingSection from "./components/PricingSection";
import FaqSection from "./components/FaqSection";
import ScrollEffects from "./components/ScrollEffects";
import { HeroActions } from "./components/HeroActions";
import { LandingNavCta } from "./components/LandingNavCta";

function Logo() {
  return (
    <Link href="/" className="nav-logo">
      <div className="nav-logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13,2 13,9 20,9" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      </div>
      <span className="nav-logo-text">Vel<em>lo</em></span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <>
      <nav id="navbar">
        <div className="nav-start">
          <Logo />
        </div>
        <div className="nav-links">
          <Link href="#how" className="nav-link">Cum funcționează</Link>
          <Link href="#pricing" className="nav-link">Prețuri</Link>
          <Link href="#faq" className="nav-link">FAQ</Link>
          <Link href="/blog" className="nav-link">Blog</Link>
        </div>
        <LandingNavCta />
      </nav>

      {/* Hero — centered, no right column */}
      <section id="hero">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="hero-title d1">
                <span className="hero-title-line1">Actele clienților tăi</span><br /><em>colectate automat.</em>
              </div>

              <div className="hero-subtitle lead">
                Trimite cereri de documente în 30 de secunde. Ei răspund cu un click, tu primești totul organizat.
              </div>

              <HeroActions />
            </div>
            <div className="hero-demo-sep" aria-hidden="true">
              <span className="hero-demo-sep-line" />
              <span className="hero-demo-sep-text">Demo live</span>
              <span className="hero-demo-sep-line" />
            </div>
            <div className="hero-demo">
              <video
                className="hero-demo-video"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              >
                <source src="/demo2.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem">
        <div className="container">
          <div className="problem-inner">
            <div className="problem-left">
              <span className="overline">Realitatea contabililor</span>
              <div className="problem-title">
                Câte ore pierzi<br /><em>alergând</em> după<br />documente?
              </div>
              <p className="problem-lead">
                Fiecare lună aduce același ciclu: sunete, mesaje, reminder-uri manuale. Clienții uită, tu insistești. Vello schimbă asta complet.
              </p>
            </div>

            <div className="pain-list">
              <div className="pain-item">
                <div className="pain-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.1 5.18 2 2 0 0 1 5.11 3h3a1 1 0 0 1 1 .75l1.2 5a1 1 0 0 1-.27.95l-1.7 1.7a16 16 0 0 0 6.6 6.6l1.7-1.7a1 1 0 0 1 .95-.27l5 1.2a1 1 0 0 1 .71.96z" />
                  </svg>
                </div>
                <div className="pain-content">
                  <h4>Telefoane repetate, răspunsuri rare</h4>
                  <p>Suni clientul de 3 ori și tot nu ai facturile. Urmărești manual fiecare caz, fiecare lună.</p>
                </div>
              </div>
              <div className="pain-item">
                <div className="pain-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
                <div className="pain-content">
                  <h4>Documente trimise pe email personal</h4>
                  <p>Primești facturi ca screenshot de calitate slabă, fără organizare.</p>
                </div>
              </div>
              <div className="pain-item">
                <div className="pain-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2h12" />
                    <path d="M6 22h12" />
                    <path d="M4 2h16v4a4 4 0 0 1-1.17 2.83L15 13l3.83 4.17A4 4 0 0 1 20 20v2H4v-2a4 4 0 0 1 1.17-2.83L9 13 5.17 8.83A4 4 0 0 1 4 6z" />
                  </svg>
                </div>
                <div className="pain-content">
                  <h4>Deadlineurile ANAF nu așteaptă</h4>
                  <p>Dacă un client întârzie cu documentele, toată munca ta se comprimă în ultimele 24 de ore.</p>
                </div>
              </div>
              <div className="pain-item">
                <div className="pain-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 10c.5-.5 1.5-1 3-1s2.5.5 3 1" />
                    <path d="M9 16c.6-.4 1.5-.75 3-.75s2.4.35 3 .75" />
                    <path d="M8 9h1" />
                    <path d="M15 9h1" />
                  </svg>
                </div>
                <div className="pain-content">
                  <h4>Relația cu clientul se deteriorează</h4>
                  <p>Insistența ta pare enervantă. De fapt, problema e că nu există un sistem clar pentru ambele părți.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how">
        <div className="container">
          <div className="how-header">
            <span className="overline">Cum funcționează</span>
            <div className="h2" style={{ marginTop: 12, marginBottom: 16 }}>
              De la cerere la <em>dosar complet</em><br />în câteva ore
            </div>
            <p className="lead" style={{ maxWidth: 500, margin: "0 auto" }}>
              Fără cont pentru client. Fără aplicație de instalat. Pur și simplu funcționează.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <div className="step-card-body">
                <h3>Selectezi clienții</h3>
                <p>Alegi unul sau mai mulți clienți din lista ta și bifezi ce documente ai nevoie — facturi, extrase, bonuri.</p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <div className="step-card-body">
                <h3>Vello trimite cererea</h3>
                <p>Un mesaj personalizat ajunge pe email sau SMS — cu un link securizat, valabil 30 de zile.</p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <div className="step-card-body">
                <h3>Clientul încarcă direct</h3>
                <p>Clientul deschide linkul de pe telefon și încarcă pozele sau PDF-urile în 2 minute. Zero fricțiune.</p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-num">4</div>
              <div className="step-card-body">
                <h3>Tu primești totul organizat</h3>
                <p>Documentele apar automat sortate pe client și perioadă. Notificare instantă când ceva nou sosește.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — fără WhatsApp în titluri */}
      <section id="features">
        <div className="container">
          <div className="features-header">
            <span className="overline">Funcționalități</span>
            <div className="h2" style={{ marginTop: 12, marginBottom: 16 }}>
              Tot ce îți trebuie,<br /><em>nimic în plus</em>
            </div>
          </div>

            <div className="features-bento">
            <div className="feat-card fc-1">
              <div className="feat-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3>Reminder automat</h3>
              <p>Clientul nu a răspuns în 3 zile? Vello trimite automat un mesaj de follow-up — fără ca tu să faci nimic. Setezi o singură dată, funcționează pentru toți clienții.</p>
              <div className="feat-demo">
                <div className="demo-message-row" style={{ background: "#E5DDD5", padding: "16px 16px 8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)", marginBottom: 6, textAlign: "center" }}>Vello · Reminder automat</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
                      <div className="demo-msg-bubble">
                        Bună ziua! Contabilul vă solicită documentele pentru luna curentă. Încărcați aici (fără cont):{" "}
                        <span style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "underline" }}>vello.ro/upload/exemplu-client</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "flex-end" }}>
                      <div className="demo-msg-bubble outgoing">Trimis acum! Mulțumesc.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="feat-card fc-3">
              <div className="feat-icon amber" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l1.92-1.92a4 4 0 0 0-5.66-5.66l-1.41 1.41" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54L4.54 12.38a4 4 0 0 0 5.66 5.66l1.41-1.41" />
                </svg>
              </div>
              <h3>Link unic, zero cont</h3>
              <p>Clientul nu instalează nimic. Deschide linkul, încarcă documentele. Gata.</p>
            </div>

            <div className="feat-card fc-4">
              <div className="feat-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4h6l2 3h10v11H3z" />
                  <path d="M3 4v13h18" />
                </svg>
              </div>
              <h3>Organizare automată</h3>
              <p>Fiecare document ajunge sortat: client, tip, perioadă. Găsești orice în 5 secunde.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials">
        <div className="container">
          <div className="testimonials-header">
            <span className="overline">Ce spun contabilii</span>
            <div className="h2" style={{ marginTop: 12 }}><em>Funcționează</em> în cabinet real</div>
          </div>

            <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="t-stars" aria-hidden="true">
                <svg width="70" height="14" viewBox="0 0 70 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g fill="currentColor">
                    <path d="M7 0l1.62 3.3L12 3.8 9.5 6.2 10.1 9.5 7 8 3.9 9.5 4.5 6.2 2 3.8l3.38-.5L7 0z" />
                    <path d="M21 0l1.62 3.3L26 3.8 23.5 6.2 24.1 9.5 21 8 17.9 9.5 18.5 6.2 16 3.8l3.38-.5L21 0z" />
                    <path d="M35 0l1.62 3.3L40 3.8 37.5 6.2 38.1 9.5 35 8 31.9 9.5 32.5 6.2 30 3.8l3.38-.5L35 0z" />
                    <path d="M49 0l1.62 3.3L54 3.8 51.5 6.2 52.1 9.5 49 8 45.9 9.5 46.5 6.2 44 3.8l3.38-.5L49 0z" />
                    <path d="M63 0l1.62 3.3L68 3.8 65.5 6.2 66.1 9.5 63 8 59.9 9.5 60.5 6.2 58 3.8l3.38-.5L63 0z" />
                  </g>
                </svg>
              </div>
              <div className="t-quote">
                Am redus timpul petrecut cu colectarea documentelor cu cel puțin 4 ore pe lună. Clienții mei sunt surprinși cât de simplu e.
              </div>
              <div className="t-author">
                <div className="t-avatar" style={{ background: "var(--sage-light)", color: "var(--sage)" }}>AP</div>
                <div>
                  <div className="t-author-name">Ana Popescu</div>
                  <div className="t-author-sub">Cabinet individual · Cluj-Napoca · 38 clienți</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="t-stars" aria-hidden="true">
                <svg width="70" height="14" viewBox="0 0 70 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g fill="currentColor">
                    <path d="M7 0l1.62 3.3L12 3.8 9.5 6.2 10.1 9.5 7 8 3.9 9.5 4.5 6.2 2 3.8l3.38-.5L7 0z" />
                    <path d="M21 0l1.62 3.3L26 3.8 23.5 6.2 24.1 9.5 21 8 17.9 9.5 18.5 6.2 16 3.8l3.38-.5L21 0z" />
                    <path d="M35 0l1.62 3.3L40 3.8 37.5 6.2 38.1 9.5 35 8 31.9 9.5 32.5 6.2 30 3.8l3.38-.5L35 0z" />
                    <path d="M49 0l1.62 3.3L54 3.8 51.5 6.2 52.1 9.5 49 8 45.9 9.5 46.5 6.2 44 3.8l3.38-.5L49 0z" />
                    <path d="M63 0l1.62 3.3L68 3.8 65.5 6.2 66.1 9.5 63 8 59.9 9.5 60.5 6.2 58 3.8l3.38-.5L63 0z" />
                  </g>
                </svg>
              </div>
              <div className="t-quote">
                Înainte sunăm fiecare client manual. Acum Vello face asta automat și eu mă ocup de contabilitate, nu de logistică.
              </div>
              <div className="t-author">
                <div className="t-avatar" style={{ background: "#D6EAF4", color: "var(--sky)" }}>MI</div>
                <div>
                  <div className="t-author-name">Mihai Ionescu</div>
                  <div className="t-author-sub">SRL contabilitate · București · 62 clienți</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="t-stars" aria-hidden="true">
                <svg width="70" height="14" viewBox="0 0 70 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g fill="currentColor">
                    <path d="M7 0l1.62 3.3L12 3.8 9.5 6.2 10.1 9.5 7 8 3.9 9.5 4.5 6.2 2 3.8l3.38-.5L7 0z" />
                    <path d="M21 0l1.62 3.3L26 3.8 23.5 6.2 24.1 9.5 21 8 17.9 9.5 18.5 6.2 16 3.8l3.38-.5L21 0z" />
                    <path d="M35 0l1.62 3.3L40 3.8 37.5 6.2 38.1 9.5 35 8 31.9 9.5 32.5 6.2 30 3.8l3.38-.5L35 0z" />
                    <path d="M49 0l1.62 3.3L54 3.8 51.5 6.2 52.1 9.5 49 8 45.9 9.5 46.5 6.2 44 3.8l3.38-.5L49 0z" />
                    <path d="M63 0l1.62 3.3L68 3.8 65.5 6.2 66.1 9.5 63 8 59.9 9.5 60.5 6.2 58 3.8l3.38-.5L63 0z" />
                  </g>
                </svg>
              </div>
              <div className="t-quote">
                Linkul pe care îl primesc clienții mei e atât de curat încât mulți m-au întrebat dacă am angajat programator.
              </div>
              <div className="t-author">
                <div className="t-avatar" style={{ background: "var(--terra-light)", color: "var(--terracotta)" }}>RC</div>
                <div>
                  <div className="t-author-name">Raluca Constantin</div>
                  <div className="t-author-sub">PFA contabilitate · Timișoara · 24 clienți</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      <FaqSection />

      {/* CTA */}
      <section id="cta">
        <div className="container">
          <div className="cta-inner">
            <span className="overline">Începe acum</span>
            <div className="cta-title">
              Gata să scapi de<br /><em>stresul actelor?</em>
            </div>
            <div className="cta-sub">14 zile gratuit, fără card. Configurezi în 10 minute.</div>

            <div className="cta-note">✓ Fără card de credit &nbsp;·&nbsp; ✓ 14 zile trial complet &nbsp;·&nbsp; ✓ Anulezi oricând</div>

            <div className="cta-stats">
              <div className="cta-stat">
                <div className="cta-stat-value">4.2 ore</div>
                <div className="cta-stat-label">economie/lună medie</div>
              </div>
              <div className="cta-stat-divider" />
              <div className="cta-stat">
                <div className="cta-stat-value sage">97%</div>
                <div className="cta-stat-label">rată de răspuns clienți</div>
              </div>
              <div className="cta-stat-divider" />
              <div className="cta-stat">
                <div className="cta-stat-value">10 min</div>
                <div className="cta-stat-label">timp de configurare</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 0 }}>
                <div style={{ width: 30, height: 30, background: "var(--sage)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13,2 13,9 20,9" />
                  </svg>
                </div>
                <span style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>Vel<em style={{ fontStyle: "italic", color: "var(--sage)" }}>lo</em></span>
              </div>
              <p>Aplicație SaaS pentru contabili români — colectare documente de la clienți, simplificată.</p>
            </div>

            <div>
              <div className="footer-col-title">Produs</div>
              <Link href="#how" className="footer-link">Cum funcționează</Link>
              <Link href="#features" className="footer-link">Funcționalități</Link>
              <Link href="#pricing" className="footer-link">Prețuri</Link>
              <Link href="#" className="footer-link">Changelog</Link>
              <Link href="#" className="footer-link">Roadmap</Link>
            </div>

            <div>
              <div className="footer-col-title">Resurse</div>
              <Link href="#" className="footer-link">Documentație</Link>
              <Link href="#" className="footer-link">Blog</Link>
              <Link href="#faq" className="footer-link">FAQ</Link>
              <Link href="#" className="footer-link">Integrări</Link>
              <Link href="#" className="footer-link">Status</Link>
            </div>

            <div>
              <div className="footer-col-title">Legal</div>
              <Link href="/termeni" className="footer-link">Termeni și condiții</Link>
              <Link href="/privacy" className="footer-link">Politica de confidențialitate</Link>
              <Link href="/gdpr" className="footer-link">GDPR</Link>
              <Link href="/cookie-uri" className="footer-link">Cookie-uri</Link>
            </div>
          </div>

          <div className="footer-bottom">
          <div className="footer-bottom-text">© {new Date().getFullYear()} Vello · Creat în România</div>
            <div className="footer-legal">
              <Link href="/termeni" className="footer-link" style={{ marginBottom: 0 }}>Termeni</Link>
              <Link href="/privacy" className="footer-link" style={{ marginBottom: 0 }}>Privacy</Link>
              <Link href="/contact" className="footer-link" style={{ marginBottom: 0 }}>Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      <ScrollEffects />
    </>
  );
}
