/** Limită upload (bytes). Supabase Storage permite de obicei până la 50MB/fișier; Vercel poate impune și el un plafon. */
export function getMaxUploadBytes(): number {
  const raw = process.env.UPLOAD_MAX_MB;
  const mb = raw ? Number(raw) : 50;
  const safe = Number.isFinite(mb) && mb > 0 ? Math.min(200, Math.floor(mb)) : 50;
  return safe * 1024 * 1024;
}

export function maxUploadSizeLabel(): string {
  const mb = getMaxUploadBytes() / (1024 * 1024);
  return `${mb} MB`;
}
