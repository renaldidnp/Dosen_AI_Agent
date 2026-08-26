import { google } from "googleapis";

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.drive({ version: "v3", auth: oauth2Client });
}

// Ambil metadata file (nama, mimeType, ukuran) dari Drive pakai file_id
export async function getFileMetadata(fileId: string) {
  const drive = getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size, webViewLink",
  });
  return res.data;
}

// Download isi file (dipakai kalau Next.js perlu baca langsung,
// tapi biasanya ini justru dipanggil dari sisi Hermes agent, bukan di sini)
export async function downloadFileBuffer(fileId: string) {
  const drive = getDriveClient();
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
  return Buffer.from(res.data as ArrayBuffer);
}

// Opsional: pindahkan/organisasi file jawaban ke subfolder per soal & mahasiswa
export async function moveFileToFolder(fileId: string, folderId: string) {
  const drive = getDriveClient();
  const file = await drive.files.get({ fileId, fields: "parents" });
  const previousParents = file.data.parents?.join(",");
  await drive.files.update({
    fileId,
    addParents: folderId,
    removeParents: previousParents,
    fields: "id, parents",
  });
}
