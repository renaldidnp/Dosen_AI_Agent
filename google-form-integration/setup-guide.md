# Cara Setup Google Form → Webhook

1. Buat Google Form sesuai struktur di `form-template/README.md`
2. Di Form editor, klik ⋮ (titik tiga) di pojok kanan atas → "Script editor"
   → ini otomatis membuka Apps Script yang sudah TERIKAT ke Form ini
3. Copy isi `config.gs` dan `Code.gs` ke project Apps Script tersebut
   (buat file baru di Apps Script editor untuk masing-masing, nama file bebas
   tapi sarankan tetap "config" dan "Code")
4. Isi `SOAL_ID_MAP` di config.gs sesuai soal yang sudah dibuat di dashboard dosen
   (ambil soalId dari database atau dari URL halaman form-settings soal tsb)
5. Set trigger:
   - Di Apps Script editor, klik ikon jam (Triggers) di sidebar kiri
   - "+ Add Trigger"
   - Function: onFormSubmit
   - Event source: From form
   - Event type: On form submit
   - Save (akan diminta authorize akses Drive & UrlFetch — izinkan)
6. Test: isi Form secara manual dengan data dummy, submit
   - Cek di Apps Script editor: Executions (sidebar kiri) untuk lihat log/error
   - Cek di Next.js: apakah record baru masuk ke tabel Submission
7. Kalau ada error "UrlFetchApp not permitted" — pastikan WEBHOOK_URL bisa diakses
   dari internet. localhost TIDAK BISA diakses Apps Script (Apps Script jalan di server
   Google, bukan di komputer kamu). Untuk development, pakai ngrok:
   ngrok http 3000
   lalu ganti WEBHOOK_URL di config.gs ke URL ngrok (https://xxxx.ngrok.io/api/webhook/form-submit)
