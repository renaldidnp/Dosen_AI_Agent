import { db } from "@/lib/db";

export default async function DaftarSubmissionPage({ params }: { params: { soalId: string } }) {
  const submissions = await db.submission.findMany({
    where: { soalId: params.soalId },
    include: { hasilKoreksi: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Daftar Submission</h1>
      <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left text-sm">
          <tr>
            <th className="p-3">Nama</th>
            <th className="p-3">NIM</th>
            <th className="p-3">Status</th>
            <th className="p-3">Skor</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-t text-sm">
              <td className="p-3">{s.namaMahasiswa}</td>
              <td className="p-3">{s.nim}</td>
              <td className="p-3">{s.status}</td>
              <td className="p-3">{s.hasilKoreksi?.skorTotal ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
