"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type IndikatorInput = { nama: string; bobot: number; rubrik: string; skorMax: number };

export default function CreateSoalPage() {
  const router = useRouter();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [googleFormUrl, setGoogleFormUrl] = useState("");
  const [indikator, setIndikator] = useState<IndikatorInput[]>([{ nama: "", bobot: 0, rubrik: "", skorMax: 100 }]);

  function addIndikator() {
    setIndikator([...indikator, { nama: "", bobot: 0, rubrik: "", skorMax: 100 }]);
  }

  function updateIndikator(i: number, field: keyof IndikatorInput, value: string | number) {
    const next = [...indikator];
    // @ts-expect-error simple dynamic assignment
    next[i][field] = value;
    setIndikator(next);
  }

  async function handleSubmit() {
    const res = await fetch("/api/soal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        judul,
        deskripsi,
        googleFormUrl,
        dosenId: "clx1abc123realid",
        indikator,
      }),
    });
    if (res.ok) router.push("/dashboard");
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Buat Soal Baru</h1>

      <input className="border w-full p-2 rounded mb-2" placeholder="Judul soal" value={judul} onChange={(e) => setJudul(e.target.value)} />
      <textarea className="border w-full p-2 rounded mb-2" placeholder="Deskripsi soal" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
      <input className="border w-full p-2 rounded mb-4" placeholder="Link Google Form untuk soal ini" value={googleFormUrl} onChange={(e) => setGoogleFormUrl(e.target.value)} />

      <h2 className="font-semibold mb-2">Indikator Penilaian</h2>
      {indikator.map((ind, i) => (
        <div key={i} className="border p-3 rounded mb-2 space-y-2">
          <input className="border w-full p-2 rounded" placeholder="Nama indikator" value={ind.nama} onChange={(e) => updateIndikator(i, "nama", e.target.value)} />
          <input type="number" className="border w-full p-2 rounded" placeholder="Bobot (%)" value={ind.bobot} onChange={(e) => updateIndikator(i, "bobot", Number(e.target.value))} />
          <textarea className="border w-full p-2 rounded" placeholder="Deskripsi rubrik penilaian" value={ind.rubrik} onChange={(e) => updateIndikator(i, "rubrik", e.target.value)} />
        </div>
      ))}
      <button onClick={addIndikator} className="text-blue-600 text-sm mb-4">
        + Tambah indikator
      </button>

      <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-md block">
        Simpan Soal
      </button>
    </div>
  );
}
