import shell from "@/app/dashboard/DashboardShell.module.css";

type Props = {
  children: React.ReactNode;
};

/** Layout mobil 9:16 — fără sidebar, în cadru telefon. */
export function DemoShell({ children }: Props) {
  return (
    <div className={shell.root} style={{ height: "100%", minHeight: 0 }}>
      <header className={shell.header}>
        <div className={shell.headerLeft}>
          <div className={shell.logo}>
            <div className={shell.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13,2 13,9 20,9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            </div>
            <span className={shell.logoText}>
              Vel<em>lo</em>
            </span>
          </div>
        </div>
        <div className={shell.avatarHeader} aria-hidden>
          MC
        </div>
      </header>
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: "var(--paper)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
