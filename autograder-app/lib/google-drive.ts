import { google } from "googleapis";
import { Readable } from "stream";
import { db } from "@/lib/db";

const SETTING_KEY = "soal_pdf_folder_id";
const ROOT_FOLDER_NAME = "Soal PDF - Autograder";
const UNCATEGORIZED = "Tanpa Mata Kuliah";
const JAWABAN_FOLDER_NAME = "Jawaban Mahasiswa";

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth: oauth2Client });
}

async function findOrCreateFolder(name: string, parentId: string | null): Promise<string> {
  const drive = getDriveClient();
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";

  const existing = await drive.files.list({
    q: `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`,
    fields: "files(id)",
    spaces: "drive",
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });

  return created.data.id!;
}

async function getRootSoalFolder(): Promise<string> {
  const cached = await db.appSetting.findUnique({ where: { key: SETTING_KEY } });
  if (cached?.value) return cached.value;

  const folderId = await findOrCreateFolder(ROOT_FOLDER_NAME, null);

  await db.appSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: folderId },
    create: { key: SETTING_KEY, value: folderId },
  });

  return folderId;
}

function toSettingKey(...parts: string[]): string {
  return parts
    .map((p) =>
      p
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
    )
    .join("_");
}

/**
 * Ambil (atau buat kalau belum ada) folder root/angkatan/kelas untuk sebuah Kelas.
 * Di-cache di Kelas.driveFolderId. Dipakai bersama oleh path PDF soal maupun
 * path jawaban mahasiswa, supaya keduanya nempel di pohon folder yang sama per kelas.
 */
async function getOrCreateKelasFolder(kelasId: string): Promise<string | null> {
  const kelas = await db.kelas.findUnique({ where: { id: kelasId } });
  if (!kelas) return null;
  if (kelas.driveFolderId) return kelas.driveFolderId;

  const root = await getRootSoalFolder();
  const angkatanFolderId = await findOrCreateFolder(kelas.angkatan, root);
  const kelasFolderId = await findOrCreateFolder(kelas.nama, angkatanFolderId);

  await db.kelas.update({ where: { id: kelasId }, data: { driveFolderId: kelasFolderId } });
  return kelasFolderId;
}

async function resolveTargetFolder(kelasId: string | null, mataKuliah: string | null): Promise<string> {
  const root = await getRootSoalFolder();
  if (!kelasId) return root;

  const kelasFolderId = await getOrCreateKelasFolder(kelasId);
  if (!kelasFolderId) return root;

  const matkulName = mataKuliah?.trim() || UNCATEGORIZED;
  const matkulSettingKey = toSettingKey("matkul_folder", kelasId, matkulName);

  const cachedMatkul = await db.appSetting.findUnique({ where: { key: matkulSettingKey } });
  if (cachedMatkul?.value) return cachedMatkul.value;

  const matkulFolderId = await findOrCreateFolder(matkulName, kelasFolderId);
  await db.appSetting.upsert({
    where: { key: matkulSettingKey },
    update: { value: matkulFolderId },
    create: { key: matkulSettingKey, value: matkulFolderId },
  });

  return matkulFolderId;
}

export async function uploadSoalPdf(
  buffer: Buffer,
  fileName: string,
  kelasId: string | null = null,
  mataKuliah: string | null = null,
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = getDriveClient();
  const folderId = await resolveTargetFolder(kelasId, mataKuliah);

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId], mimeType: "application/pdf" },
    media: { mimeType: "application/pdf", body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });

  const fileId = res.data.id!;
  await drive.permissions.create({ fileId, requestBody: { role: "reader", type: "anyone" } });
  const file = await drive.files.get({ fileId, fields: "webViewLink" });

  return { fileId, webViewLink: file.data.webViewLink! };
}

/**
 * Memindahkan file jawaban mahasiswa (hasil upload dari Google Form) dari folder
 * default milik Google Forms, ke folder root/angkatan/kelas/Jawaban Mahasiswa
 * milik kelas terkait. Dipanggil dari webhook setelah submission diterima.
 *
 * Mengembalikan null (tanpa throw) kalau kelasId tidak valid, supaya pemanggil
 * bisa memilih untuk tetap menyimpan submission dengan link/fileId lama sebagai fallback.
 */
export async function moveSubmissionFile(
  fileId: string,
  kelasId: string,
): Promise<{ fileId: string; webViewLink: string } | null> {
  const kelasFolderId = await getOrCreateKelasFolder(kelasId);
  if (!kelasFolderId) return null;

  const drive = getDriveClient();
  const jawabanFolderId = await findOrCreateFolder(JAWABAN_FOLDER_NAME, kelasFolderId);

  const current = await drive.files.get({ fileId, fields: "parents" });
  const previousParents = current.data.parents?.join(",");

  const updated = await drive.files.update({
    fileId,
    addParents: jawabanFolderId,
    removeParents: previousParents,
    fields: "id, webViewLink",
  });

  return { fileId: updated.data.id!, webViewLink: updated.data.webViewLink! };
}