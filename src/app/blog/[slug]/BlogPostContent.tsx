export function BlogPostContent({ slug }: { slug: string }) {
  if (slug === "lansare-saas-contabili-2-saptamani-ziua-1") {
    return <LansareZiua1 />;
  }
  return null;
}

function LansareZiua1() {
  return (
    <>
      <p className="blog-p">
        Sunt un developer fullstack român și am observat o problemă simplă dar dureroasă: contabilii pierd ore întregi în fiecare lună trimițând manual mesaje pe WhatsApp clienților cerând facturi, extrase bancare și bonuri.
      </p>
      <p className="blog-p">
        În fiecare lună. Aceleași mesaje. Aceiași clienți care uită. Aceleași follow-up-uri.
      </p>
      <p className="blog-p">
        Așa că am construit Vello — un portal simplu de colectare documente. Fiecare client primește un link personal de upload. Uploadează fișierele direct. Contabilul vede un dashboard cu cine a trimis ce și cine nu a trimis nimic.
      </p>
      <p className="blog-p">
        Fără conturi pentru clienți. Fără onboarding complicat. Doar un link.
      </p>

      <h2 className="blog-h2">Cum am validat ideea</h2>
      <p className="blog-p">
        Înainte să scriu o singură linie de cod, am trimis mesaje la ~50 de contabili români direct pe WhatsApp. Fără pitch, doar o întrebare: &quot;Trimiteți manual mesaje clienților în fiecare lună cerând documente?&quot;
      </p>
      <p className="blog-p">
        Majoritatea au spus da. Câțiva au spus că pierd 3-5 ore lunar doar urmărind acte. A fost suficient.
      </p>
      <p className="blog-p">
        Am construit MVP-ul în 2 săptămâni folosind Next.js și Supabase. Landing page, signup, flow de upload pentru client, dashboard. Atât.
      </p>

      <h2 className="blog-h2">Cifrele din ziua 1</h2>
      <ul className="blog-ul">
        <li>172 vizitatori</li>
        <li>18 au ajuns pe pagina de signup</li>
        <li>2 conturi înregistrate</li>
        <li>15 vizite din Reddit</li>
        <li>4 din Facebook</li>
        <li>2 persoane au ajuns pe pagina de checkout Stripe</li>
      </ul>
      <p className="blog-p">
        Nu exploziv, dar real. Bounce rate-ul de 59% îmi spune că mesajul de pe landing page mai are de lucru.
      </p>

      <h2 className="blog-h2">Prețuri</h2>
      <ul className="blog-ul">
        <li><strong>Gratuit:</strong> până la 5 clienți</li>
        <li><strong>Standard €19/lună:</strong> până la 40 de clienți</li>
        <li><strong>Premium €39/lună:</strong> clienți nelimitați</li>
      </ul>
      <p className="blog-p">
        Am oferit coduri de acces gratuit 45 de zile tuturor celor care au arătat interes în timpul validării.
      </p>

      <h2 className="blog-h2">Ce urmează</h2>
      <p className="blog-p">
        Continui outreach-ul manual pe WhatsApp, lansez reclame Meta săptămâna viitoare cu un buget mic, și postez actualizări săptămânale de progres.
      </p>
      <p className="blog-p">
        Ținta pentru luna 1: 10 clienți plătitori.
      </p>
    </>
  );
}
