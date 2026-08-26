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

// Bentuk akhir yang cocok dengan field skorPerIndikator (Json) di model HasilKoreksi
export type HasilIndikatorFinal = {
  indikatorId: string;
  nama: string;
  skor: number;
  catatan: string;
};

export type GradingResult = {
  submission_id: string;
  skorTotal: number;
  skorPerIndikator: HasilIndikatorFinal[];
  feedback: string;
};
