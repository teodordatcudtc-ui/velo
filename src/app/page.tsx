import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PricingSection from "./components/PricingSection";
import FaqSection from "./components/FaqSection";
import ScrollEffects from "./components/ScrollEffects";

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
      <span className="nav-logo-text">Vel<em>o</em></span>
    </Link>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <nav id="navbar">
        <div className="nav-start">
          <Logo />
        </div>
        <div className="nav-links">
          <Link href="#how" className="nav-link">Cum funcționează</Link>
          <Link href="#features" className="nav-link">Funcționalități</Link>
          <Link href="#pricing" className="nav-link">Prețuri</Link>
          <Link href="#faq" className="nav-link">FAQ</Link>
        </div>
        <div className="nav-cta">
          {user ? (
            <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
          ) : (
            <Link href="/login" className="btn btn-ghost">Intră în cont</Link>
          )}
          <Link href="#cta" className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 14, borderRadius: "var(--r-md)" }}>
            Încearcă gratuit
          </Link>
        </div>
      </nav>

      {/* Hero — centered, no right column */}
      <section id="hero">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              Nou · Reminder automat
            </div>

            <div className="hero-title d1">
              Scapă de grija<br /><em>actelor întârziate.</em>
            </div>

            <div className="hero-subtitle lead">
              Trimite cereri de documente clienților tăi în 30 de secunde. Ei răspund cu un click, tu primești totul organizat.
            </div>

            <div className="hero-actions">
              <Link href="#cta" className="btn btn-primary btn-primary-lg">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Încearcă 14 zile gratuit
              </Link>
              <Link href="#how" className="btn btn-secondary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                </svg>
                Vezi demo
              </Link>
            </div>

            <div className="hero-trust">
              <div className="hero-trust-avatars">
                <div className="trust-avatar ta1">AP</div>
                <div className="trust-avatar ta2">MI</div>
                <div className="trust-avatar ta3">CD</div>
                <div className="trust-avatar ta4">RB</div>
              </div>
              <div className="hero-trust-text">
                <strong>+120 contabili</strong> folosesc Velo zilnic
              </div>
            </div>

            <div className="scroll-hint">
              <div className="scroll-hint-line" />
              Scroll pentru mai mult
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
                Fiecare lună aduce același ciclu: sunete, mesaje, reminder-uri manuale. Clienții uită, tu insistești. Velo schimbă asta complet.
              </p>
            </div>

            <div className="pain-list">
              <div className="pain-item">
                <div className="pain-icon">📞</div>
                <div className="pain-content">
                  <h4>Telefoane repetate, răspunsuri rare</h4>
                  <p>Suni clientul de 3 ori și tot nu ai facturile. Urmărești manual fiecare caz, fiecare lună.</p>
                </div>
              </div>
              <div className="pain-item">
                <div className="pain-icon">📁</div>
                <div className="pain-content">
                  <h4>Documente trimise pe email personal</h4>
                  <p>Primești facturi ca screenshot de calitate slabă, fără organizare.</p>
                </div>
              </div>
              <div className="pain-item">
                <div className="pain-icon">⌛</div>
                <div className="pain-content">
                  <h4>Deadlineurile ANAF nu așteaptă</h4>
                  <p>Dacă un client întârzie cu documentele, toată munca ta se comprimă în ultimele 24 de ore.</p>
                </div>
              </div>
              <div className="pain-item">
                <div className="pain-icon">😤</div>
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
                <h3>Velo trimite cererea</h3>
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
              <div className="feat-icon">💬</div>
              <h3>Reminder automat</h3>
              <p>Clientul nu a răspuns în 3 zile? Velo trimite automat un mesaj de follow-up — fără ca tu să faci nimic. Setezi o singură dată, funcționează pentru toți clienții.</p>
              <div className="feat-demo">
                <div className="demo-message-row" style={{ background: "#E5DDD5", padding: "16px 16px 8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)", marginBottom: 6, textAlign: "center" }}>Velo · Reminder automat</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
                      <div className="demo-msg-bubble">Bună ziua! Documentele pentru Februarie 2025 nu au fost primite încă. Vă rugăm să le trimiteți până pe 15 Mar →</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "flex-end" }}>
                      <div className="demo-msg-bubble outgoing">Trimis acum! Mulțumesc 🙏</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="feat-card fc-3">
              <div className="feat-icon amber">🔗</div>
              <h3>Link unic, zero cont</h3>
              <p>Clientul nu instalează nimic. Deschide linkul, încarcă documentele. Gata.</p>
            </div>

            <div className="feat-card fc-4">
              <div className="feat-icon">📂</div>
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
              <div className="t-stars">★★★★★</div>
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
              <div className="t-stars">★★★★★</div>
              <div className="t-quote">
                Înainte sunăm fiecare client manual. Acum Velo face asta automat și eu mă ocup de contabilitate, nu de logistică.
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
              <div className="t-stars">★★★★★</div>
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

            <form action="/signup" method="get" className="cta-input-group">
              <input className="cta-input" type="email" name="email" placeholder="emailul tău de contabil..." required />
              <button type="submit" className="btn btn-primary btn-primary-lg" style={{ flexShrink: 0, borderRadius: "var(--r-md)" }}>
                Încearcă gratuit
              </button>
            </form>

            <div className="cta-note">✓ Fără card de credit &nbsp;·&nbsp; ✓ 14 zile trial complet &nbsp;·&nbsp; ✓ Anulezi oricând</div>

            <div className="cta-stats">
              <div className="cta-stat">
                <div className="cta-stat-value">+120</div>
                <div className="cta-stat-label">contabili activi</div>
              </div>
              <div className="cta-stat-divider" />
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
                <span style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>Vel<em style={{ fontStyle: "italic", color: "var(--sage)" }}>o</em></span>
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
              <Link href="#" className="footer-link">Termeni și condiții</Link>
              <Link href="#" className="footer-link">Politica de confidențialitate</Link>
              <Link href="#" className="footer-link">GDPR</Link>
              <Link href="#" className="footer-link">Cookie-uri</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-text">© {new Date().getFullYear()} Velo · Făcut cu ☕ în România</div>
            <div className="footer-legal">
              <Link href="#" className="footer-link" style={{ marginBottom: 0 }}>Termeni</Link>
              <Link href="#" className="footer-link" style={{ marginBottom: 0 }}>Privacy</Link>
              <Link href="#" className="footer-link" style={{ marginBottom: 0 }}>Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      <ScrollEffects />
    </>
  );
}
