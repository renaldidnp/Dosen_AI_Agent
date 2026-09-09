# SwaKoreksiIn

Sistem autograding berbasis AI untuk dosen perguruan tinggi di Indonesia. SwaKoreksiIn mengotomasi proses koreksi jawaban mahasiswa menggunakan multi-agent LLM (Gemini, OpenRouter, Groq — otomatis failover), terintegrasi dengan Google Drive dan email otomatis.

## Fitur Utama

- **Dashboard Dosen** — Manajemen kelas, mahasiswa, soal, dan hasil koreksi dalam satu tempat
- **AI Grading** — Multi-agent: Agent **Penilai** menskor jawaban per rubrik, lalu Agent **Peninjau** memverifikasi ulang hasilnya (pergerakan skor + alasan tiap indikator)
- **Multi-Provider LLM** — Mendukung Gemini, OpenRouter (DeepSeek), dan Groq (Llama) dengan failover otomatis berurutan; cukup atur lewat `LLM_PROVIDERS`
- **Integrasi Google Drive** — Penyimpanan otomatis PDF soal dan jawaban mahasiswa
- **Link Submit Tanpa Login** — Setiap soal punya link submit unik bertoken yang bisa dibatasi masa berlakunya
- **Email Otomatis** — Link submit dikirim ke mahasiswa dan hasil koreksi dikirim via Resend
- **Asynchronous Pipeline** — Grading diproses secara async, hasil dikirim via callback
- **Live Trace AI** — Dashboard menampilkan langkah agent secara real-time (unduh → Pass 1 → Pass 2 → callback → email) lengkap dengan durasi & provider; timeline per submission juga tersedia
- **Dark/Light Theme** — UI modern dengan dukungan tema gelap dan terang
- **AI Chat Assistant** — Bantuan pembuatan soal dan rubrik melalui chat dengan AI

## Arsitektur

```
┌──────────────┐     ┌──────────────┐
│    Dosen     │     │  Mahasiswa   │
└──────┬───────┘     └──────┬───────┘
       │ Dashboard UI       │ Submit via link /submit/{token}
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│  Next.js App │◄────│ Link Submit  │ (dikirim lewat email)
│   :3000      │     └──────────────┘
└──┬───┬───┬───┘
   │   │   ▼
   │   │  ┌──────────────┐
   │   │  │ Google Drive  │  (upload PDF soal & jawaban)
   │   │  └──────────────┘
   │   ▼
   │  ┌──────────────┐     ┌──────────────────────┐
   │  │ Agent Service│────►│ LLM Multi-Provider   │
   │  │   :4000      │     │ Gemini/OpenRouter/   │
   │  └──────┬───────┘     │ Groq (failover)      │
   │         │ Download PDF└──────────────────────┘
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
| googleapis | 176 | Google Drive, OAuth2 |
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
| LLM Multi-Provider | Gemini 3.6 Flash, OpenRouter (DeepSeek), Groq (Llama 3.3) — AI grading multi-agent & pembuatan soal |
| Google Drive API | Penyimpanan PDF soal & jawaban |
| MySQL | Database utama |
| Resend | Email delivery |

## Persyaratan

- Node.js 18+
- MySQL 8+
- Google Cloud Project (Drive API, Gemini API)
- Resend API key
- ngrok (untuk development, agar agent lokal bisa kirim callback ke app)

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
# Urutan prioritas provider LLM (failover otomatis bila provider gagal):
LLM_PROVIDERS=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
# Opsional — provider cadangan/peninjau:
OPENROUTER_API_KEY=
OPENROUTER_MODEL=deepseek/deepseek-chat
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
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
APP_URL=http://localhost:3000
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

### 6. Setup Callback (Development)

```bash
ngrok http 3000
```

Gunakan URL ngrok sebagai `CALLBACK_URL` di agent agar hasil grading bisa dikirim ke app.

## Cara Kerja

### Alur Grading

1. **Dosen membuat kelas** → Tambahkan daftar mahasiswa (nama, NIM, email)
2. **Dosen membuat soal** → PDF soal + rubrik di-generate dan diupload ke Google Drive. Sistem membuat link submit unik bertoken (dengan batas waktu sesuai pilihan dosen), lalu mengirim email notifikasi berisi link tersebut ke semua mahasiswa kelas.
3. **Mahasiswa submit jawaban** → Klik link `/submit/{token}` di email, isi nama/NIM/email, lalu upload PDF jawaban. Tanpa perlu login.
4. **Backend memproses** → Memvalidasi token & batas waktu, mencegah duplikat NIM, menyimpan PDF ke Drive, lalu memanggil Agent untuk grading
5. **Agent grading (multi-agent)** → Mengunduh PDF dari Google Drive, mengekstrak teks, lalu **Pass 1 — Agent Penilai** menskor tiap indikator. Hasilnya diverifikasi **Pass 2 — Agent Peninjau** di-cross-check dengan rubrik (keputusan "setuju"/"koreksi" per indikator + alasan). Bila peninjau gagal, hasil pass 1 tetap dipakai (ditandai `reviewAktif = false`)
6. **Callback results** → Agent mengirim hasil grading kembali ke backend
7. **Email results** → Backend menyimpan hasil dan mengirim email ke mahasiswa via Resend

### Pembuatan Soal dengan AI

Dosen bisa menggunakan AI Chat Assistant saat membuat soal. Cukup deskripsikan soal yang diinginkan, dan AI akan menghasilkan draft soal beserta rubrik yang bisa langsung diterapkan.

## Database Schema

| Model | Deskripsi |
|-------|-----------|
| `Dosen` | Akun dosen (nama, email, password) |
| `Kelas` | Kelas (nama, angkatan, Drive folder) |
| `Mahasiswa` | Mahasiswa (nama, NIM, email, kelas) |
| `Soal` | Soal/tugas (judul, deskripsi, mata kuliah, PDF URL, submit token + expiry) |
| `Indikator` | Rubrik penilaian (nama, bobot, rubrik, skor max) |
| `Submission` | Jawaban mahasiswa (status, file ID, NIM) |
| `HasilKoreksi` | Hasil koreksi (skor total, skor per indikator + tinjauan, feedback, direviewOleh, reviewAktif) |

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

### Soal

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/soal` | List semua soal |
| POST | `/api/soal` | Buat soal baru (+ generate PDF + email) |
| GET | `/api/soal/[id]` | Detail soal |
| PUT | `/api/soal/[id]` | Update soal |
| DELETE | `/api/soal/[id]` | Hapus soal |

### Submit Mahasiswa (Public)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/submit/[token]/soal` | Info soal berdasarkan token link (untuk halaman submit) |
| POST | `/api/submit/[token]` | Terima upload jawaban mahasiswa (multipart PDF) |
| GET | `/submit/[token]` | Halaman submit publik untuk mahasiswa (tanpa login) |

### Callback

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/webhook/grade-callback` | Callback hasil grading dari Agent |
| POST | `/api/webhook/trace` | Live trace: progres langkah grading dari Agent (download → pass1 → pass2 → callback → mail) |

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
│   │   ├── submit/              # Halaman submit publik mahasiswa
│   │   ├── nilai/               # Halaman hasil mahasiswa
│   │   └── api/                 # API routes
│   ├── prisma/                  # Database schema
│   ├── lib/                     # Shared utilities
│   │   ├── auth.ts              # JWT auth
│   │   ├── google-drive.ts      # Google Drive operations
│   │   ├── mailer.ts            # Resend email
│   │   └── generate-soal-pdf.ts # PDF generation
│   └── components/              # Reusable components
│
├── autograder-agent/            # Express.js AI agent
│   └── api-wrapper/
│       └── src/
│           ├── routes/          # API endpoints
│           ├── controllers/     # Business logic
│           └── services/        # assistantService (prompt AI), llm/ (provider + failover), drive, callback
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
