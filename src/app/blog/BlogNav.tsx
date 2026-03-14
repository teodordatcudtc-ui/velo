import Link from "next/link";
import { LandingNavCta } from "../components/LandingNavCta";

export function BlogNav() {
  return (
    <nav id="navbar" className="blog-nav">
      <div className="nav-start">
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
      </div>
      <div className="nav-links">
        <Link href="/#how" className="nav-link">Cum funcționează</Link>
        <Link href="/#pricing" className="nav-link">Prețuri</Link>
        <Link href="/#faq" className="nav-link">FAQ</Link>
        <Link href="/blog" className="nav-link nav-link-active">Blog</Link>
      </div>
      <LandingNavCta />
    </nav>
  );
}
