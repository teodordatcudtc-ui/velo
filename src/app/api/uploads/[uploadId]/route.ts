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

  const { data: blob, error: downloadError } = await admin.storage
    .from(BUCKET)
    .download(upload.file_path);

  if (downloadError || !blob) {
    return NextResponse.json(
      { error: downloadError?.message ?? "Eroare la încărcare document." },
      { status: 500 }
    );
  }

  const safeName = upload.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const disposition = download
    ? `attachment; filename="${safeName}"`
    : "inline";

  return new NextResponse(blob, {
    headers: {
      "Content-Type": blob.type || "application/octet-stream",
      "Content-Disposition": disposition,
    },
  });
}
