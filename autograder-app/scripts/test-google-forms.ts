/**
 * Skrip test manual untuk lib/google-forms.ts
 *
 * CARA PAKAI:
 * 1. Copy file ini ke root project autograder-app, misal: scripts/test-google-forms.ts
 * 2. Pastikan .env sudah lengkap (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)
 * 3. Jalankan salah satu:
 *      npx tsx scripts/test-google-forms.ts
 *    atau kalau belum ada tsx:
 *      npm install -D tsx --save-dev
 *      npx tsx scripts/test-google-forms.ts
 *
 * Skrip ini TIDAK menyentuh database sama sekali — murni test langsung ke Google API,
 * supaya kalau ada error, kita tahu itu masalah scope/API, bukan masalah kode integrasi.
 */

import "dotenv/config";
import { createKelasForm, addSoalToFormDropdown } from "../lib/google-forms";

async function main() {
  console.log("=== TEST 1: createKelasForm ===");
  console.log("Membuat form test untuk kelas dummy...\n");

  const { formId, formUrl, editUrl } = await createKelasForm("TEST-KELAS", "9999");

  console.log("✅ Form berhasil dibuat!");
  console.log("Form ID   :", formId);
  console.log("Form URL  :", formUrl, "(buka ini untuk lihat hasilnya sebagai mahasiswa)");
  console.log("Edit URL  :", editUrl, "(buka ini untuk edit sebagai dosen / cek manual)");

  console.log("\n=== TEST 2: addSoalToFormDropdown ===");
  console.log("Menambahkan 2 soal dummy ke dropdown...\n");

  await addSoalToFormDropdown(formId, "[ML] Preprocessing - Tugas 1");
  console.log("✅ Soal 1 ditambahkan: [ML] Preprocessing - Tugas 1");

  await addSoalToFormDropdown(formId, "[ML] Training - Tugas 2");
  console.log("✅ Soal 2 ditambahkan: [ML] Training - Tugas 2");

  console.log("\n=== TEST 3: idempotency check ===");
  console.log("Menambahkan judul yang SAMA lagi (harusnya tidak dobel)...\n");

  await addSoalToFormDropdown(formId, "[ML] Preprocessing - Tugas 1");
  console.log("✅ Tidak error, dan seharusnya dropdown TIDAK punya opsi dobel.");

  console.log("\n=== SELESAI ===");
  console.log("Silakan buka Form URL di atas dan cek manual:");
  console.log("1. Ada 4 field: Nama Mahasiswa, NIM, Email, Pilih Soal/Tugas");
  console.log("2. Dropdown 'Pilih Soal/Tugas' berisi PERSIS 2 opsi (bukan 3, bukan placeholder lama)");
  console.log("3. Tidak ada field 'Upload File Jawaban' (memang harus ditambah manual, ini normal)");
  console.log("\nJangan lupa hapus form test ini manual dari Google Drive/Forms setelah selesai cek.");
}

main().catch((err) => {
  console.error("\n❌ TEST GAGAL:");
  console.error(err?.response?.data ?? err?.message ?? err);
  process.exit(1);
});