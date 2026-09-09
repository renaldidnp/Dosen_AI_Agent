export type RubrikIndikator = {
  indikatorId: string;
  nama: string;
  bobot: number;
  rubrik: string;
  skorMax: number;
};

export type GradeRequest = {
  submission_id: string;
  file_id: string;
  rubric: RubrikIndikator[];
};

export type HasilIndikatorRaw = {
  indikatorId: string;
  skor: number;
  feedback: string;
};

// Keputusan Agent Peninjau (pass 2) per indikator
export type ReviewIndikator = {
  indikatorId: string;
  keputusan: "setuju" | "koreksi";
  skorAkhir: number;
  alasan: string;
  saran?: string;
};

// Hasil lengkap Agent Peninjau
export type ReviewResult = {
  hasilIndikator: ReviewIndikator[];
  catatan: string;
};

// Info review yang ditempel per indikator pada skorPerIndikator (untuk UI)
export type IndikatorReviewInfo = {
  keputusan: "setuju" | "koreksi";
  skorAwal: number;
  skorAkhir: number;
  alasan: string;
};

// Bentuk akhir yang cocok dengan field skorPerIndikator (Json) di model HasilKoreksi
export type HasilIndikatorFinal = {
  indikatorId: string;
  nama: string;
  skor: number;
  catatan: string;
  review?: IndikatorReviewInfo | null;
  saran?: string | null;
};

export type GradingResult = {
  submission_id: string;
  skorTotal: number;
  skorPerIndikator: HasilIndikatorFinal[];
  feedback: string;
  direviewOleh?: string | null;
  reviewAktif?: boolean;
};

export type GradingErrorResult = {
  submission_id: string;
  status: "error";
  errorMessage: string;
};

// === Tipe untuk generate soal (AI Assistant di form Buat Soal) ===

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type GenerateSoalRequest = {
  prompt: string;
  history: ChatHistoryItem[];
};

export type IndikatorDraft = {
  nama: string;
  bobot: number;
  rubrik: string;
  skorMax: number;
};

export type SoalDraftResult = {
  judul: string;
  deskripsi: string;
  indikator: IndikatorDraft[];
};

export type GenerateSoalResponse = {
  reply: string;
  draft: SoalDraftResult;
};
