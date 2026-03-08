import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const BUCKET = "uploads";
const SIGNED_URL_EXPIRY = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  const { uploadId } = await params;
  if (!uploadId) {
    return NextResponse.json({ error: "Lipsă id upload." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("file_path, file_name")
    .eq("id", uploadId)
    .single();

  if (uploadError || !upload) {
    return NextResponse.json({ error: "Document negăsit." }, { status: 404 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";
  const admin = createAdminClient();

  if (download) {
    const { data: blob, error: downloadError } = await admin.storage
      .from(BUCKET)
      .download(upload.file_path);

    if (downloadError || !blob) {
      return NextResponse.json(
        { error: downloadError?.message ?? "Eroare la descărcare." },
        { status: 500 }
      );
    }

    const safeName = upload.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
    return new NextResponse(blob, {
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  }

  const { data: signed, error: signedError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(upload.file_path, SIGNED_URL_EXPIRY);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: signedError?.message ?? "Eroare la generare link." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signed.signedUrl });
}
