import { google } from "googleapis";
// @ts-ignore - pdf-parse tidak punya types yang sempurna untuk semua versi
import pdfParse from "pdf-parse";

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Download file PDF dari Google Drive berdasarkan file_id,
 * lalu ekstrak isinya jadi teks biasa.
 */
export async function downloadAndExtractPdfText(fileId: string): Promise<string> {
  const drive = getDriveClient();

  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });

  const buffer = Buffer.from(res.data as ArrayBuffer);
  const parsed = await pdfParse(buffer);

  return parsed.text;
}
