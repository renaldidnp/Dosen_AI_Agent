import { Resend } from "resend";

export async function sendHasilPenilaianEmail(params: { to: string; namaMahasiswa: string; judulSoal: string; skorTotal: number; feedback: string }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY belum diset, email hasil penilaian tidak dikirim.");
    return;
  }

  const resend = new Resend(apiKey);
  const { to, namaMahasiswa, judulSoal, skorTotal, feedback } = params;

  // PENTING: "onboarding@resend.dev" cuma untuk testing/development.
  // Kalau mau kirim ke email asli mahasiswa secara production,
  // ganti dengan domain kamu sendiri yang SUDAH diverifikasi di
  // dashboard Resend (Settings > Domains). Domain yang belum
  // diverifikasi akan bikin resend.emails.send() throw error.
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Autograder <onboarding@resend.dev>";

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
    `,
  });

  if (error) {
    // Resend SDK kadang return error di object, bukan throw exception.
    // Kita throw manual di sini biar konsisten ditangkap oleh try/catch pemanggil.
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

export async function sendNotifikasiSoalBaruEmail(params: { to: string; namaMahasiswa: string; judulSoal: string; mataKuliah: string | null; deskripsi: string | null; googleFormUrl: string; pdfUrl?: string | null }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY belum diset, email notifikasi soal baru tidak dikirim.");
    return;
  }

  const resend = new Resend(apiKey);
  const { to, namaMahasiswa, judulSoal, mataKuliah, deskripsi, googleFormUrl, pdfUrl } = params;

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Autograder <onboarding@resend.dev>";

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
        Setelah selesai mengerjakan, submit jawaban kamu melalui form berikut:<br />
        <a href="${googleFormUrl}" style="color: #4f46e5;">${googleFormUrl}</a>
      </p>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}
