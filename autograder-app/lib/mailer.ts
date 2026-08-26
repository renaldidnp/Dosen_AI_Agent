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
