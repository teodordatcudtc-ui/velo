import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const BUCKET = "uploads";

function htmlErrorPage(title: string, message: string) {
  const year = new Date().getFullYear();
  const body = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charSet="utf-8" />
  <title>${title} · Vello</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --ink: #1a1a2e;
      --ink-soft: #3d3d5c;
      --ink-muted: #8888aa;
      --paper: #f5f3ee;
      --paper-2: #edeae3;
      --sage: #4b7a6e;
      --sage-light: #d4e8e3;
      --sage-xlight: #eef5f3;
      --terracotta: #c4614a;
      --r-lg: 16px;
      --r-xl: 24px;
      --touch-min: 44px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top, #ffffff, var(--paper));
      color: var(--ink);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .wrap {
      max-width: 480px;
      width: 100%;
    }
    .card {
      background: #fff;
      border-radius: var(--r-xl);
      border: 1px solid #e2ded5;
      box-shadow: 0 18px 60px rgba(26, 26, 46, 0.18);
      padding: 28px 24px 22px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--terracotta);
      margin-bottom: 14px;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--terracotta);
    }
    h1 {
      font-family: "Fraunces", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 26px;
      line-height: 1.15;
      letter-spacing: -0.02em;
      margin-bottom: 10px;
    }
    h1 em {
      font-style: italic;
      font-weight: 400;
      color: var(--sage);
    }
    p {
      font-size: 14px;
      line-height: 1.7;
      color: var(--ink-soft);
      margin-bottom: 14px;
    }
    .hint {
      font-size: 13px;
      color: var(--ink-muted);
      margin-top: 4px;
    }
    .actions {
      margin-top: 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: var(--touch-min);
      padding: 10px 20px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
    }
    .btn-primary {
      background: var(--sage);
      color: #fff;
      box-shadow: 0 4px 18px rgba(75, 122, 110, 0.32);
    }
    .btn-primary:hover {
      background: #3a6358;
      transform: translateY(-1px);
    }
    .btn-ghost {
      background: transparent;
      color: var(--ink-muted);
    }
    .footer {
      text-align: center;
      margin-top: 14px;
      font-size: 11px;
      color: var(--ink-muted);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="badge"><span class="badge-dot"></span>Acces document refuzat</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <p class="hint">
        Dacă crezi că este o eroare, verifică să fii autentificat în contul contabilului corect și că ai deschis documentul din dashboard-ul tău Vello.
      </p>
      <div class="actions">
        <a href="/dashboard/documente" class="btn btn-primary">Înapoi la documente</a>
        <a href="/login" class="btn btn-ghost">Schimbă contul</a>
      </div>
    </div>
    <div class="footer">
      Vel<em style="font-style:italic;color:var(--sage);">lo</em> · ${year}
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(body, {
    status: 403,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const { uploadId } = await params;
  if (!uploadId) {
    return htmlErrorPage(
      "Document indisponibil",
      "Acest document nu poate fi afișat pentru că linkul pare incomplet sau invalid."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return htmlErrorPage(
      "Trebuie să fii autentificat",
      "Pentru a vedea acest document trebuie să fii autentificat în contul de contabil corespunzător."
    );
  }

  // 1) Luăm upload-ul + clientul lui, respectând RLS
  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("file_path, file_name, client_id")
    .eq("id", uploadId)
    .single();

  if (uploadError || !upload) {
    return htmlErrorPage(
      "Documentul nu mai există",
      "Documentul pe care încerci să îl deschizi nu mai este disponibil sau a fost șters."
    );
  }

  // 2) Verificăm explicit că utilizatorul logat este contabilul acelui client
  const { data: owningClient, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", upload.client_id)
    .eq("accountant_id", user.id)
    .single();

  if (clientError || !owningClient) {
    return htmlErrorPage(
      "Acest document nu este pentru tine",
      "Documentul aparține unui alt client sau este gestionat de un alt contabil. Doar contabilul asociat acelui client poate vedea fișierul."
    );
  }

  const download = new URL(request.url).searchParams.get("download") === "1";
  const admin = createAdminClient();
  const safeName = upload.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const { data: signed, error: signedUrlError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(upload.file_path, 60, {
      ...(download ? { download: safeName } : {}),
    });

  if (signedUrlError || !signed?.signedUrl) {
    return htmlErrorPage(
      "Eroare la deschiderea documentului",
      "A apărut o eroare la generarea linkului securizat pentru fișier. Încearcă din nou sau contactează-ne dacă problema persistă."
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const { uploadId } = await params;
  if (!uploadId) {
    return NextResponse.json({ error: "Upload invalid." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("id, file_path, client_id")
    .eq("id", uploadId)
    .single();

  if (uploadError || !upload) {
    return NextResponse.json({ error: "Documentul nu exista." }, { status: 404 });
  }

  const { data: owningClient, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", upload.client_id)
    .eq("accountant_id", user.id)
    .single();

  if (clientError || !owningClient) {
    return NextResponse.json({ error: "Nu ai dreptul sa stergi acest document." }, { status: 403 });
  }

  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([upload.file_path]);

  const { error: deleteError } = await admin
    .from("uploads")
    .delete()
    .eq("id", upload.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Curata si markerul de deduplicare ANAF pentru a permite reimportul aceluiasi mesaj.
  await admin
    .from("anaf_message_receipts")
    .delete()
    .eq("upload_id", upload.id);

  return NextResponse.json({ ok: true });
}
