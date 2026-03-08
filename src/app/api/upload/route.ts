import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

type UploadInsert = Database["public"]["Tables"]["uploads"]["Insert"];

const BUCKET = "uploads";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = formData.get("token") as string | null;
  const documentTypeId = formData.get("documentTypeId") as string | null;
  const file = formData.get("file") as File | null;

  if (!token || !documentTypeId || !file?.size) {
    return NextResponse.json(
      { error: "Lipsesc token, tip document sau fișier." },
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

  const { data: docType } = await supabase
    .from("document_types")
    .select("id")
    .eq("id", documentTypeId)
    .eq("client_id", clientId)
    .single();

  if (!docType) {
    return NextResponse.json(
      { error: "Tip document invalid pentru acest client." },
      { status: 400 }
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = `${clientId}/${year}/${month}/${documentTypeId}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message || "Eroare la încărcare fișier." },
      { status: 500 }
    );
  }

  const insertPayload: UploadInsert = {
    client_id: clientId,
    document_type_id: documentTypeId,
    file_path: filePath,
    file_name: file.name,
    month,
    year,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from("uploads")
    .insert(insertPayload);

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    return NextResponse.json(
      { error: insertError.message || "Eroare la salvare înregistrare." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
