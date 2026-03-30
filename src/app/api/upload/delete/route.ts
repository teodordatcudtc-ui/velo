import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const BUCKET = "uploads";
type UploadLookup = { id: string; file_path: string; client_id: string };

export async function POST(request: Request) {
  const { token, uploadId } = (await request.json().catch(() => ({}))) as {
    token?: string;
    uploadId?: string;
  };

  if (!token || !uploadId) {
    return NextResponse.json(
      { error: "Lipsesc token sau id-ul fișierului." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("unique_token", token)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Link invalid." }, { status: 404 });
  }

  const clientId = (client as { id: string }).id;

  const { data: uploadData, error: uploadError } = await supabase
    .from("uploads")
    .select("id, file_path, client_id")
    .eq("id", uploadId)
    .single();

  const upload = uploadData as UploadLookup | null;
  if (uploadError || !upload || upload.client_id !== clientId) {
    return NextResponse.json({ error: "Fișierul nu a fost găsit." }, { status: 404 });
  }

  const { error: deleteDbError } = await supabase
    .from("uploads")
    .delete()
    .eq("id", uploadId)
    .eq("client_id", clientId);

  if (deleteDbError) {
    return NextResponse.json(
      { error: deleteDbError.message || "Eroare la ștergerea înregistrării." },
      { status: 500 }
    );
  }

  const { error: deleteStorageError } = await supabase.storage
    .from(BUCKET)
    .remove([upload.file_path]);

  if (deleteStorageError) {
    return NextResponse.json(
      { error: deleteStorageError.message || "Fișier șters parțial. Reîncearcă." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

