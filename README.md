# Nexus.grade

Sistem autograding berbasis AI untuk dosen perguruan tinggi di Indonesia. Nexus.grade mengotomasi proses koreksi jawaban mahasiswa menggunakan Google Gemini LLM, terintegrasi dengan Google Forms dan Google Drive.

## Fitur Utama

- **Dashboard Dosen** — Manajemen kelas, mahasiswa, soal, dan hasil koreksi dalam satu tempat
- **AI Grading** — Menggunakan Google Gemini 3.6 Flash untuk menilai jawaban mahasiswa berdasarkan rubrik per indikator
- **Integrasi Google Forms** — Otomatis membuat form submission untuk setiap kelas
- **Integrasi Google Drive** — Penyimpanan otomatis PDF soal dan jawaban mahasiswa
- **Email Otomatis** — Pengiriman hasil koreksi ke email mahasiswa via Resend
- **Webhook Bridge** — Google Apps Script menghubungkan Google Forms ke backend secara real-time
- **Asynchronous Pipeline** — Grading diproses secara async, hasil dikirim via callback
- **Dark/Light Theme** — UI modern dengan dukungan tema gelap dan terang
- **AI Chat Assistant** — Bantuan pembuatan soal dan rubrik melalui chat dengan AI

## Arsitektur

```
┌──────────────┐     ┌──────────────┐
│    Dosen     │     │  Mahasiswa   │
└──────┬───────┘     └──────┬───────┘
       │ Dashboard UI       │ Submit jawaban
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│  Next.js App │◄────│ Google Forms │
│   :3000      │     └──────┬───────┘
└──┬───┬───┬───┘            │ onFormSubmit
   │   │   │                ▼
   │   │   │     ┌──────────────┐
   │   │   │     │ Apps Script  │──── webhook ────┐
   │   │   │     └──────────────┘                 │
   │   │   │                                      │
   │   │   └──────────────────────────────────────┘
   │   │
   │   ▼
   │  ┌──────────────┐     ┌──────────────┐
   │  │ Agent Service│────►│Google Gemini │
   │  │   :4000      │     │  AI LLM      │
   │  └──────┬───────┘     └──────────────┘
   │         │ Download PDF
   │         ▼
   │  ┌──────────────┐
   │  │ Google Drive  │
   │  └──────────────┘
   │
   ▼
┌──────────────┐     ┌──────────────┐
│    MySQL     │     │    Resend    │
│ (Prisma ORM) │     │    Email     │
└──────────────┘     └──────────────┘
```

## Tech Stack

### Frontend & Backend (`autograder-app/`)

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Next.js | 14 | Full-stack React framework (App Router) |
| React | 18 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3.4 | Utility-first CSS |
| Prisma | 5.22 | Database ORM |
| jose | 6.2 | JWT signing/verification |
| bcryptjs | 3.0 | Password hashing |
| googleapis | 176 | Google Drive, Forms, OAuth2 |
| pdfkit | 0.20 | PDF generation |
| resend | 6.22 | Email delivery |

### AI Agent (`autograder-agent/`)

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Express.js | 4.19 | HTTP API server |
| TypeScript | 5.5 | Type safety |
| pdf-parse | 1.1 | PDF text extraction |
| googleapis | 140 | Google Drive OAuth2 |

### External Services

| Service | Kegunaan |
|---------|----------|
| Google Gemini 3.6 Flash | AI grading & pembuatan soal |
| Google Drive API | Penyimpanan PDF soal & jawaban |
| Google Forms API | Form submission mahasiswa |
| Google Apps Script | Webhook bridge (Forms → Backend) |
| MySQL | Database utama |
| Resend | Email delivery |

## Persyaratan

- Node.js 18+
- MySQL 8+
- Google Cloud Project (Drive API, Forms API, Gemini API)
- Resend API key
- ngrok (untuk development, agar Apps Script bisa reach localhost)

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/username/DosenAIAgent.git
cd DosenAIAgent
```

### 2. Setup Backend Agent

```bash
cd autograder-agent/api-wrapper
npm install
cp .env.example .env
```

Konfigurasi `.env`:

```env
PORT=4000
CALLBACK_URL=http://localhost:3000/api/webhook/grade-callback
AGENT_CALLBACK_SECRET=your_callback_secret
AGENT_SECRET=your_agent_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

### 3. Setup Frontend App

```bash
cd ../../autograder-app
npm install
cp .env.example .env
```

Konfigurasi `.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/nexus_grade"
WEBHOOK_SECRET=your_webhook_secret
AGENT_CALLBACK_SECRET=your_callback_secret
AGENT_SECRET=your_agent_secret
AGENT_API_URL=http://localhost:4000
AUTOGRADER_AGENT_URL=http://localhost:4000
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_DRIVE_FOLDER_ID=your_root_drive_folder_id
RESEND_API_KEY=your_resend_api_key
```

### 4. Setup Database

```bash
cd prisma
npx prisma db push
```

### 5. Jalankan Development Server

Terminal 1 — Agent Service:
```bash
cd autograder-agent/api-wrapper
npm run dev
```

Terminal 2 — Next.js App:
```bash
cd autograder-app
npm run dev
```

### 6. Setup Webhook (Development)

```bash
ngrok http 3000
```

Gunakan URL ngrok sebagai `CALLBACK_URL` di agent dan webhook URL di Apps Script.

## Cara Kerja

### Alur Grading

1. **Dosen membuat kelas** → Sistem otomatis membuat Google Form
2. **Dosen membuat soal** → PDF soal + rubrik di-generate dan diupload ke Google Drive. Judul soal ditambahkan ke dropdown Google Form. Mahasiswa mendapat email notifikasi.
3. **Mahasiswa submit jawaban** → Upload PDF jawaban melalui Google Form
4. **Apps Script trigger** → `onFormSubmit` menangkap submission dan mengirim webhook ke backend
5. **Backend memproses** → Memvalidasi, deduplikasi, menyimpan submission, lalu memanggil Agent untuk grading
6. **Agent grading** → Mengunduh PDF dari Google Drive, mengekstrak teks, mengirim ke Google Gemini untuk scoring
7. **Callback results** → Agent mengirim hasil grading kembali ke backend
8. **Email results** → Backend menyimpan hasil dan mengirim email ke mahasiswa via Resend

### Pembuatan Soal dengan AI

Dosen bisa menggunakan AI Chat Assistant saat membuat soal. Cukup deskripsikan soal yang diinginkan, dan Gemini akan menghasilkan draft soal beserta rubrik yang bisa langsung diterapkan.

## Database Schema

| Model | Deskripsi |
|-------|-----------|
| `Dosen` | Akun dosen (nama, email, password) |
| `Kelas` | Kelas (nama, angkatan, Google Form ID, Drive folder) |
| `Mahasiswa` | Mahasiswa (nama, NIM, email, kelas) |
| `Soal` | Soal/tugas (judul, deskripsi, mata kuliah, PDF URL) |
| `Indikator` | Rubrik penilaian (nama, bobot, rubrik, skor max) |
| `Submission` | Jawaban mahasiswa (status, file ID, form response ID) |
| `HasilKoreasi` | Hasil koreksi (skor total, skor per indikator, feedback) |

## API Endpoints

### Authentication

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Register dosen baru |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |

### Kelas

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/kelas` | List semua kelas |
| POST | `/api/kelas` | Buat kelas baru |
| GET | `/api/kelas/[id]` | Detail kelas |
| PATCH | `/api/kelas/[id]` | Update kelas |
| DELETE | `/api/kelas/[id]` | Hapus kelas |
| POST | `/api/kelas/[id]/generate-form` | Buat/regenerate Google Form |

### Soal

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/soal` | List semua soal |
| POST | `/api/soal` | Buat soal baru (+ generate PDF + email) |
| GET | `/api/soal/[id]` | Detail soal |
| PUT | `/api/soal/[id]` | Update soal |
| DELETE | `/api/soal/[id]` | Hapus soal |

### Webhook & Callback

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/webhook/form-submit` | Webhook dari Google Apps Script |
| POST | `/api/webhook/grade-callback` | Callback hasil grading dari Agent |

### AI

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/ai-agent/generate-soal` | Generate soal dengan AI |

### Student Results

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/nilai/[submissionId]?token=...` | Halaman hasil untuk mahasiswa (public, token-protected) |

## Struktur Projek

```
DosenAIAgent/
├── autograder-app/              # Next.js frontend + API
│   ├── app/                     # Halaman & API routes
│   │   ├── auth/                # Login & Register
│   │   ├── (dosen)/             # Dashboard dosen
│   │   │   ├── dashboard/       # Halaman utama
│   │   │   ├── kelas/           # Manajemen kelas
│   │   │   ├── soal/            # Pembuatan soal
│   │   │   └── output/          # Daftar submission
│   │   ├── nilai/               # Halaman hasil mahasiswa
│   │   └── api/                 # API routes
│   ├── prisma/                  # Database schema
│   ├── lib/                     # Shared utilities
│   │   ├── auth.ts              # JWT auth
│   │   ├── google-drive.ts      # Google Drive operations
│   │   ├── google-forms.ts      # Google Forms operations
│   │   ├── mailer.ts            # Resend email
│   │   └── generate-soal-pdf.ts # PDF generation
│   └── components/              # Reusable components
│
├── autograder-agent/            # Express.js AI agent
│   └── api-wrapper/
│       └── src/
│           ├── routes/          # API endpoints
│           ├── controllers/     # Business logic
│           └── services/        # Gemini, Drive, Callback
│
└── google-form-integration/     # Google Apps Script templates
    ├── setup-guide.md
    └── apps-script/
```

## Kontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b feature/nama-fitur`)
3. Commit perubahan (`git commit -m 'Tambahkan fitur XYZ'`)
4. Push ke branch (`git push origin feature/nama-fitur`)
5. Buka Pull Request

## Lisensi

MIT License

---

Dibuat untuk membantu dosen Indonesia dalam mengotomasi proses penilaian mahasiswa.
