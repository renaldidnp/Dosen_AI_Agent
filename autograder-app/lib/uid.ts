/**
 * Generation ID unik yang bekerja di SEMUA koneksi, termasuk HTTP (non-secure).
 *
 * `crypto.randomUUID()` hanya tersedia di secure context (HTTPS/localhost).
 * Di `http://IP_VPS` (belum ada domain/HTTPS), method itu tidak ada dan
 * melempar TypeError — mis. pada halaman /soal/create saat kirim chat AI.
 */
export function uid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}