import PDFDocument from "pdfkit";

type IndikatorForPdf = {
  nama: string;
  bobot: number;
  rubrik: string;
  skorMax: number;
};

type SoalForPdf = {
  judul: string;
  deskripsi?: string | null;
  indikator: IndikatorForPdf[];
};

export function generateSoalPdf(soal: SoalForPdf): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Judul
    doc.fontSize(18).font("Helvetica-Bold").text(soal.judul, { align: "left" });
    doc.moveDown(0.5);

    // Deskripsi
    if (soal.deskripsi) {
      doc.fontSize(11).font("Helvetica").text(soal.deskripsi, { align: "left" });
      doc.moveDown(1);
    }

    // Tabel indikator
    doc.fontSize(13).font("Helvetica-Bold").text("Indikator Penilaian");
    doc.moveDown(0.5);

    const colX = { nama: 50, bobot: 220, skorMax: 280, rubrik: 350 };
    const rowStartY = doc.y;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Nama", colX.nama, rowStartY, { width: 160 });
    doc.text("Bobot", colX.bobot, rowStartY, { width: 50 });
    doc.text("Skor Max", colX.skorMax, rowStartY, { width: 60 });
    doc.text("Rubrik", colX.rubrik, rowStartY, { width: 195 });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font("Helvetica");
    soal.indikator.forEach((ind) => {
      const y = doc.y;
      doc.text(ind.nama, colX.nama, y, { width: 160 });
      doc.text(`${ind.bobot}%`, colX.bobot, y, { width: 50 });
      doc.text(`${ind.skorMax}`, colX.skorMax, y, { width: 60 });
      doc.text(ind.rubrik, colX.rubrik, y, { width: 195 });
      doc.moveDown(0.8);
    });

    doc.end();
  });
}
