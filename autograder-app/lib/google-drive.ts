import { google } from "googleapis";
import { Readable } from "stream";
import { db } from "@/lib/db";

const SETTING_KEY = "soal_pdf_folder_id";
const ROOT_FOLDER_NAME = "Soal PDF - Autograder";
const UNCATEGORIZED = "Tanpa Mata Kuliah"; // fallback kalau mataKuliah kosong

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

/** Slug aman untuk dipakai sebagai key AppSetting (bukan nama folder — nama folder tetap pakai teks asli) */
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
 * Resolve folder tujuan lengkap: root/{angkatan}/{nama kelas}/{mata kuliah}
 * - Level angkatan+kelas di-cache di Kelas.driveFolderId (folder kelas, belum termasuk mata kuliah)
 * - Level mata kuliah di-cache di AppSetting, karena satu kelas bisa punya banyak mata kuliah
 * - Kalau soal tidak punya kelas (data lama): langsung taruh di root
 */
async function resolveTargetFolder(kelasId: string | null, mataKuliah: string | null): Promise<string> {
  const root = await getRootSoalFolder();
  if (!kelasId) return root;

  const kelas = await db.kelas.findUnique({ where: { id: kelasId } });
  if (!kelas) return root;

  // Folder kelas (root/angkatan/kelas) — pakai cache di Kelas.driveFolderId
  let kelasFolderId = kelas.driveFolderId;
  if (!kelasFolderId) {
    const angkatanFolderId = await findOrCreateFolder(kelas.angkatan, root);
    kelasFolderId = await findOrCreateFolder(kelas.nama, angkatanFolderId);
    await db.kelas.update({ where: { id: kelasId }, data: { driveFolderId: kelasFolderId } });
  }

  // Folder mata kuliah (root/angkatan/kelas/matkul) — cache di AppSetting per kelas+matkul
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

export async function uploadSoalPdf(buffer: Buffer, fileName: string, kelasId: string | null = null, mataKuliah: string | null = null): Promise<{ fileId: string; webViewLink: string }> {
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
