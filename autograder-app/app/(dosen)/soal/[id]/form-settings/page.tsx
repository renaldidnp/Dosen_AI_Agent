import { db } from "@/lib/db";

export default async function FormSettingsPage({ params }: { params: { id: string } }) {
  const soal = await db.soal.findUnique({ where: { id: params.id } });
  if (!soal) return <div className="p-8">Soal tidak ditemukan</div>;

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-bold mb-4">Pengaturan Google Form — {soal.judul}</h1>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div>
          <p className="text-sm text-gray-500">Link Google Form</p>
          <a href={soal.googleFormUrl ?? "#"} target="_blank" className="text-blue-600 underline">
            {soal.googleFormUrl ?? "Belum diatur"}
          </a>
        </div>
        <div>
          <p className="text-sm text-gray-500">Folder Google Drive tujuan</p>
          <p>{soal.driveFolderId ?? "Belum diatur"}</p>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Catatan: pastikan Apps Script pada Form ini mengarah ke soalId =<code className="mx-1">{soal.id}</code>
          di file <code>google-form-integration/apps-script/config.gs</code>.
        </p>
      </div>
    </div>
  );
}
