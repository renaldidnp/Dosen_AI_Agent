import { google } from "googleapis";
import { Readable } from "stream";
import { db } from "@/lib/db";

const SETTING_KEY = "soal_pdf_folder_id";
const ROOT_FOLDER_NAME = "Soal PDF - Autograder";

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth: oauth2Client });
}

async function findOrCreateFolder(name: string, parentId: string | null): Promise<string> {
  const drive = getDriveClient();
  const parentClause = parentId ? ` and '${parentId}' in parents` : "";

  const existing = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`,
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

/**
 * Ambil folder tujuan untuk soal ini:
 * - Kalau soal punya kelas: root/{angkatan}/{nama kelas}, cache-nya disimpan di Kelas.driveFolderId
 * - Kalau soal tidak punya kelas (data lama): langsung di root
 */
async function resolveTargetFolder(kelasId: string | null): Promise<string> {
  const root = await getRootSoalFolder();
  if (!kelasId) return root;

  const kelas = await db.kelas.findUnique({ where: { id: kelasId } });
  if (!kelas) return root;

  if (kelas.driveFolderId) return kelas.driveFolderId;

  const angkatanFolderId = await findOrCreateFolder(kelas.angkatan, root);
  const kelasFolderId = await findOrCreateFolder(kelas.nama, angkatanFolderId);

  await db.kelas.update({ where: { id: kelasId }, data: { driveFolderId: kelasFolderId } });

  return kelasFolderId;
}

export async function uploadSoalPdf(buffer: Buffer, fileName: string, kelasId: string | null = null): Promise<{ fileId: string; webViewLink: string }> {
  const drive = getDriveClient();
  const folderId = await resolveTargetFolder(kelasId);

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
