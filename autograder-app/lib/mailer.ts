import { Resend } from "resend";

// ==========================================================
// Helper kecil: escape user content & template email bersama
// ==========================================================

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:10px;">${label}</a>`;
}

function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#4f46e5;padding:20px 28px;">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.5px;">SwaKoreksiIn</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;color:#0f172a;font-size:14px;line-height:1.7;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:18px 28px;text-align:center;color:#94a3b8;font-size:11px;line-height:1.6;">
              Dikoreksi otomatis oleh SwaKoreksiIn — Agent Penilai + Agent Peninjau<br />
              Email ini dikirim otomatis oleh sistem, mohon tidak dibalas.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ==========================================================
// EMAIL 1: Hasil penilaian untuk mahasiswa
// ==========================================================

export async function sendHasilPenilaianEmail(params: {
  to: string;
  namaMahasiswa: string;
  judulSoal: string;
  skorTotal: number;
  feedback: string;
  link: string;
  direviewOleh?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY belum diset, email hasil penilaian tidak dikirim.");
    return;
  }

  const resend = new Resend(apiKey);
  const { to, namaMahasiswa, judulSoal, skorTotal, feedback, link, direviewOleh } = params;

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SwaKoreksiIn <onboarding@resend.dev>";
  const nama = escapeHtml(namaMahasiswa);
  const judul = escapeHtml(judulSoal);
  const catatanPeninjau = direviewOleh
    ? `<p>Hasil ini juga sudah <strong>dicek ulang oleh ${escapeHtml(direviewOleh)}</strong> agar penilaiannya semakin adil. <span style="color:#059669;">&#10003;</span></p>`
    : "";

  const body = `
    <p style="margin:0 0 16px;font-size:15px;">Halo <strong>${nama}</strong>, kabar baik! &#128075;</p>
    <p style="margin:0 0 20px;">Jawaban kamu untuk <strong>${judul}</strong> sudah selesai dikoreksi oleh AI. <strong>Jangan lupa lihat catatannya, ya!</strong></p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td align="center" style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:14px;padding:20px 16px;">
          <span style="display:block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6366f1;">Skor Total</span>
          <span style="display:block;font-size:40px;font-weight:800;color:#0f172a;line-height:1.2;">${typeof skorTotal === "number" ? skorTotal.toFixed(1) : skorTotal}</span>
        </td>
      </tr>
    </table>

    ${catatanPeninjau}

    <p style="margin:0 0 4px;font-weight:700;font-size:15px;">Catatan dari AI</p>
    <p style="margin:0 0 20px;color:#334155;white-space:pre-line;">${escapeHtml(feedback)}</p>

    <p style="margin:0 0 14px;">Mau lihat rincian nilai per indikator, lengkap dengan pertimbangan tiap bagian? Klik tombolnya &#128071;</p>
    <p style="margin:0;">${emailButton(link, "Lihat Rincian Nilai")}</p>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Kabar baik: nilai ${judul} sudah keluar!`,
    html: emailLayout(body),
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

// ==========================================================
// EMAIL 2: Notifikasi soal/tugas baru
// ==========================================================

export async function sendNotifikasiSoalBaruEmail(params: { to: string; namaMahasiswa: string; judulSoal: string; mataKuliah: string | null; deskripsi: string | null; submitLink: string; pdfUrl?: string | null }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY belum diset, email notifikasi soal baru tidak dikirim.");
    return;
  }

  const resend = new Resend(apiKey);
  const { to, namaMahasiswa, judulSoal, mataKuliah, deskripsi, submitLink, pdfUrl } = params;

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SwaKoreksiIn <onboarding@resend.dev>";
  const nama = escapeHtml(namaMahasiswa);
  const judul = escapeHtml(judulSoal);
  const matkul = escapeHtml(mataKuliah);
  const ringkasan = escapeHtml(deskripsi);
  const linkSoal = escapeHtml(pdfUrl);
  const linkSubmit = escapeHtml(submitLink);

  const body = `
    <p style="margin:0 0 16px;font-size:15px;">Halo <strong>${nama}</strong>! &#10024;</p>
    <p style="margin:0 0 20px;">Ada tugas baru menantimu${matkul ? ` di <strong>${matkul}</strong>` : ""}. Tenang saja, kerjakan santai tapi jangan lupa batas waktunya, ya:</p>

    <p style="margin:0 0 6px;font-size:17px;font-weight:800;color:#1e293b;">${judul}</p>
    ${ringkasan ? `<p style="margin:0 0 22px;color:#334155;">${ringkasan}</p>` : `<p style="margin:0 0 22px;"></p>`}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
      <tr>
        <td style="padding:0 0 14px;">
          <span style="font-size:13px;font-weight:700;">1. Baca soalnya dulu</span>
          ${linkSoal ? `<p style="margin:4px 0 0;">${emailButton(linkSoal, "Lihat Soal & Rubrik")}</p>` : `<p style="margin:4px 0 0;color:#64748b;">File soal terlampir di halaman kumpul.</p>`}
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 6px;">
          <span style="font-size:13px;font-weight:700;">2. Kerjakan lalu kumpulkan</span>
          <p style="margin:4px 0 0;">${emailButton(linkSubmit, "Kumpulkan Jawaban")}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#64748b;">Koreksi otomatis akan berjalan setelah kamu mengumpulkan jawaban. Selamat mengerjakan! &#127793;</p>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Tugas baru menantimu: ${judul}`,
    html: emailLayout(body),
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}