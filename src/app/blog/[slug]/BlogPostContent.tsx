export function BlogPostContent({ slug }: { slug: string }) {
  if (slug === "de-ce-clientii-trimit-actele-tarziu-si-cum-ii-faci-sa-trimita-la-timp") {
    return <ClientiiTrimitTarziu />;
  }
  if (slug === "de-ce-contabilii-pierd-ore-intregi-in-fiecare-luna") {
    return <ContabiliiPierdOre />;
  }
  if (slug === "lansare-saas-contabili-2-saptamani-ziua-1") {
    return <LansareZiua1 />;
  }
  return null;
}

function ClientiiTrimitTarziu() {
  return (
    <>
      <h2 className="blog-h2">O scenă pe care orice contabil o cunoaște</h2>
      <p className="blog-p">
        E data de 20 a lunii. Ai nevoie de extrasul bancar de la un client până mâine. I-ai trimis mesaj pe 1, pe 10, pe 15.
        Răspunsul e același: &quot;Trimit azi.&quot;
      </p>
      <p className="blog-p">
        Ziua trece. Extrasul nu vine.
      </p>
      <p className="blog-p">
        Nu e primul client care face asta. Nu va fi ultimul. Și de fiecare dată, termenul ANAF nu așteaptă.
      </p>

      <h2 className="blog-h2">De ce se întâmplă asta — cu adevărat</h2>
      <p className="blog-p">
        Primul instinct e să dai vina pe client. Dar realitatea e mai simplă: clientul tău nu are un sistem clar. Mesajul tău pe WhatsApp e unul dintre zecile pe care le primește zilnic.
        Îl vede, îl marchează mental ca &quot;trebuie să fac asta&quot;, și uită.
      </p>
      <p className="blog-p">
        Nu e rea-voință. E lipsa unui proces.
      </p>
      <p className="blog-p">Alte motive frecvente:</p>
      <ul className="blog-ul">
        <li>
          Nu știe exact ce trebuie să trimită. &quot;Documentele lunii&quot; e vag. Extrasul de la ce bancă? Facturile de la furnizori sau și cele emise? Bonurile de benzină intră?
        </li>
        <li>
          Nu are un loc clar unde să le trimită. WhatsApp azi, email mâine, poate și pe Drive dacă mai ții minte să îi dai acces. Haosul generează amânare.
        </li>
        <li>
          Nu simte urgența. Pentru tine termenul e critic. Pentru el e o sarcină administrativă printre altele.
        </li>
      </ul>

      <h2 className="blog-h2">Ce funcționează cu adevărat</h2>
      <h2 className="blog-h2">1. Fii specific în cerere</h2>
      <p className="blog-p">
        În loc de &quot;trimite documentele lunii&quot;, trimite o listă clară: &quot;Am nevoie de: extrasul BCR pentru februarie, facturile de la furnizori, bonurile de combustibil.&quot; Clientul nu mai trebuie să ghicească.
      </p>

      <h2 className="blog-h2">2. Trimite cererea în prima zi a lunii, nu la mijloc</h2>
      <p className="blog-p">
        Cu cât trimiți mai târziu, cu atât ai mai puțin timp să urmărești. Prima zi a lunii e momentul în care clienții sunt cei mai receptivi — tocmai au închis luna anterioară.
      </p>

      <h2 className="blog-h2">3. Un singur canal, consistent</h2>
      <p className="blog-p">
        Dacă trimiți pe WhatsApp azi și pe email săptămâna viitoare, clientul se pierde. Alege un canal și rămâi la el în fiecare lună.
      </p>

      <h2 className="blog-h2">4. Reminder automat înainte de deadline</h2>
      <p className="blog-p">
        Nu aștepta să expire termenul ca să trimiți al doilea mesaj. Un reminder trimis pe 10 și pe 15 ale lunii, automat, elimină nevoia de a urmări manual.
      </p>

      <h2 className="blog-h2">5. Fă uploadul cât mai simplu posibil</h2>
      <p className="blog-p">
        Cu cât sunt mai mulți pași între intenție și acțiune, cu atât mai mare șansa de amânare. Dacă clientul trebuie să se logheze, să caute folderul, să redenumească fișierul — amână.
        Dacă primește un link și apasă upload — face imediat.
      </p>

      <h2 className="blog-h2">Concluzie</h2>
      <p className="blog-p">
        Clienții nu trimit actele târziu pentru că nu le pasă. Trimit târziu pentru că nu au un sistem clar și simplu.
      </p>
      <p className="blog-p">
        Responsabilitatea de a crea acel sistem e a ta — și când o faci, vei vedea că aceiași clienți care te chinuiau în fiecare lună devin brusc punctuali.
      </p>
      <p className="blog-p">
        Vello automatizează întregul proces — cerere automată în prima zi a lunii, link personal per client, reminder automat dacă nu a trimis.
        Testează gratuit la vello.ro.
      </p>
    </>
  );
}

function ContabiliiPierdOre() {
  return (
    <>
      <h2 className="blog-h2">O problemă pe care orice contabil român o cunoaște</h2>
      <p className="blog-p">
        Sfârșitul de lună. Termenul pentru declarații se apropie. Și încă aștepți facturile de la 7 clienți.
      </p>
      <p className="blog-p">
        Unul trimite pe WhatsApp poze neclare, altul pe email personal, al treilea promite &quot;mâine&quot; pentru a treia zi consecutiv. Tu trimiți același mesaj, la aceiași oameni, în fiecare lună.
      </p>
      <p className="blog-p">
        Am vorbit cu peste 50 de contabili români înainte să construiesc Vello. Aproape toți spuneau același lucru: pierd 3-5 ore lunar doar urmărind documente — nu făcând contabilitate.
      </p>

      <h2 className="blog-h2">Calculul real</h2>
      <p className="blog-p">
        Dacă ai 40 de clienți și pierzi în medie 5 minute per client lunar cu mesaje, reminder-uri și urmărit cine a trimis și cine nu:
      </p>
      <ul className="blog-ul">
        <li><strong>3+ ore</strong> lunar pierdute pe urmărit acte</li>
        <li><strong>36+ ore</strong> anual — aproape o săptămână de muncă</li>
        <li>Fără să numărăm stresul termenelor ANAF când un client întârzie</li>
      </ul>

      <h2 className="blog-h2">Soluția simplă</h2>
      <p className="blog-p">
        Fiecare client primește un link personal. Intră pe link, uploadează documentele direct — fără cont, fără aplicație instalată, fără complicații. Tu primești notificare instant și vezi într-un dashboard cine a trimis, ce anume și cine nu a trimis nimic.
      </p>
      <p className="blog-p">
        Fără WhatsApp. Fără email împrăștiat. Fără urmărit manual.
      </p>

      <h2 className="blog-h2">De ce funcționează pentru clienții tăi</h2>
      <p className="blog-p">
        Clientul tău nu uită să trimită actele pentru că e nepăsător. Uită pentru că nu are un sistem clar. Un link personal, trimis în prima zi a lunii, elimină scuza &quot;am uitat&quot; și pune responsabilitatea acolo unde trebuie.
      </p>

      <h2 className="blog-h2">Concluzie</h2>
      <p className="blog-p">
        Colectarea documentelor nu ar trebui să fie cea mai stresantă parte a lunii tale.
      </p>
      <p className="blog-p">
        Vello rezolvă exact asta — simplu, fără complicații tehnice, fără onboarding lung. Poți fi configurat în 15 minute.
      </p>
      <p className="blog-p">
        Încearcă gratuit la vello.ro — primele 45 de zile fără niciun cost.
      </p>
    </>
  );
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
