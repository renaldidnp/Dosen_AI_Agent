import { Resend } from "resend";

export async function sendHasilPenilaianEmail(params: {
  to: string;
  namaMahasiswa: string;
  judulSoal: string;
  skorTotal: number;
  feedback: string;
  link: string; // ← baru
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY belum diset, email hasil penilaian tidak dikirim.");
    return;
  }

  const resend = new Resend(apiKey);
  const { to, namaMahasiswa, judulSoal, skorTotal, feedback, link } = params;

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SwaKoreksiIn <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Hasil Penilaian: ${judulSoal}`,
    html: `
      <p>Halo ${namaMahasiswa},</p>
      <p>Jawaban kamu untuk <strong>${judulSoal}</strong> sudah dikoreksi.</p>
      <p><strong>Skor Total: ${skorTotal}</strong></p>
      <p>Feedback:</p>
      <p>${feedback}</p>
      <p><a href="${link}" style="color: #4f46e5;">Lihat rincian nilai per indikator &rarr;</a></p>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

export async function sendNotifikasiSoalBaruEmail(params: { to: string; namaMahasiswa: string; judulSoal: string; mataKuliah: string | null; deskripsi: string | null; submitLink: string; pdfUrl?: string | null }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY belum diset, email notifikasi soal baru tidak dikirim.");
    return;
  }

  const resend = new Resend(apiKey);
  const { to, namaMahasiswa, judulSoal, mataKuliah, deskripsi, submitLink, pdfUrl } = params;

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SwaKoreksiIn <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Tugas Baru: ${judulSoal}`,
    html: `
      <p>Halo ${namaMahasiswa},</p>
      <p>Ada tugas baru untuk kamu${mataKuliah ? ` di mata kuliah <strong>${mataKuliah}</strong>` : ""}:</p>
      <p style="font-size: 16px;"><strong>${judulSoal}</strong></p>
      ${deskripsi ? `<p>${deskripsi}</p>` : ""}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

      ${
        pdfUrl
          ? `
      <p style="margin-bottom: 4px;"><strong>📄 Langkah 1 — Baca soal &amp; rubrik penilaian</strong></p>
      <p style="margin-top: 0;">
        <a href="${pdfUrl}" style="color: #4f46e5;">${pdfUrl}</a>
      </p>
      `
          : ""
      }

      <p style="margin-bottom: 4px;"><strong>✍️ Langkah ${pdfUrl ? "2" : "1"} — Kerjakan &amp; submit jawaban</strong></p>
      <p style="margin-top: 0;">
        Setelah selesai mengerjakan, submit jawaban kamu melalui link berikut:<br />
        <a href="${submitLink}" style="color: #4f46e5;">${submitLink}</a>
      </p>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}
