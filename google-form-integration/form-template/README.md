# Struktur Pertanyaan Google Form — Autograder

Buat Form baru di forms.google.com dengan pertanyaan berikut, URUTAN DAN TIPE HARUS SAMA
karena Code.gs membaca jawaban berdasarkan urutan index (itemResponses[0], [1], dst):

1. Nama Lengkap → Short answer, wajib
2. NIM → Short answer, wajib
3. Email → Short answer (validasi: Email), wajib
4. Pilih Soal/Tugas → Dropdown atau Multiple choice, wajib
   (opsi = judul soal, harus sinkron dengan field `judul` di DB —
   lihat mapping soalId di config.gs)
5. Upload Jawaban → File upload, wajib
   (aktifkan "Google Drive" sebagai tujuan penyimpanan otomatis)

Settings yang WAJIB diaktifkan:

- Responses > "Collect email addresses" boleh OFF (kita sudah tanya manual di pertanyaan #3)
- Responses > File upload akan otomatis membuat folder Drive bernama
  "[Nama Form] (File responses)" — folder ini yang jadi sumber file_id
- Klik titik tiga (⋮) di kanan atas Form editor > "Script editor" untuk buka Apps Script
  yang sudah terikat ke Form ini (bound script)
