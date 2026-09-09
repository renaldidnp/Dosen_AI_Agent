export function generateAppsScriptTemplate(params: {
  formId: string;
  kelasId: string;
  webhookUrl: string;
  webhookSecret: string;
}): string {
  const { formId, kelasId, webhookUrl, webhookSecret } = params;

  return `/**
 * Auto-generated Apps Script untuk kelas ini.
 * JANGAN ubah nilai FORM_ID, KELAS_ID, WEBHOOK_URL, WEBHOOK_SECRET di bawah —
 * itu sudah disesuaikan otomatis untuk kelas ini oleh sistem.
 *
 * Cara pakai:
 * 1. Buka form kelas ini > titik tiga (kanan atas) > Apps Script (atau script.google.com > New Project).
 * 2. Hapus isi Code.gs default, paste seluruh isi file ini.
 * 3. Simpan (Ctrl+S / Cmd+S).
 * 4. Jalankan fungsi "setup" sekali (pilih "setup" di dropdown fungsi, klik Run).
 *    Google akan minta izin akses — klik Allow / Izinkan.
 * 5. Selesai. Setiap ada submission baru di form ini, otomatis terkirim ke sistem.
 */

const FORM_ID = "${formId}";
const KELAS_ID = "${kelasId}";
const WEBHOOK_URL = "${webhookUrl}";
const WEBHOOK_SECRET = "${webhookSecret}";

const FIELD_NAMA = "Nama Mahasiswa";
const FIELD_NIM = "NIM";
const FIELD_EMAIL = "Email";
const FIELD_SOAL = "Pilih Soal/Tugas";

function setup() {
  const form = FormApp.openById(FORM_ID);

  // Hapus trigger lama punya form ini dulu, biar tidak dobel kalau setup() dijalankan berkali-kali.
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "onFormSubmit") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("onFormSubmit").forForm(form).onFormSubmit().create();
  Logger.log("Trigger onFormSubmit berhasil dipasang untuk form: " + FORM_ID);
}

function onFormSubmit(e) {
  try {
    const itemResponses = e.response.getItemResponses();

    let namaMahasiswa = "";
    let nim = "";
    let emailMahasiswa = "";
    let judulSoal = "";
    let driveFileId = "";

    itemResponses.forEach(function (itemResponse) {
      const title = itemResponse.getItem().getTitle();
      const response = itemResponse.getResponse();

      if (title === FIELD_NAMA) {
        namaMahasiswa = response;
      } else if (title === FIELD_NIM) {
        nim = response;
      } else if (title === FIELD_EMAIL) {
        emailMahasiswa = response;
      } else if (title === FIELD_SOAL) {
        judulSoal = response;
      } else if (itemResponse.getItem().getType() === FormApp.ItemType.FILE_UPLOAD) {
        // File upload question mengembalikan array berisi fileId (ambil yang pertama).
        if (Array.isArray(response) && response.length > 0) {
          driveFileId = response[0];
        }
      }
    });

    if (!driveFileId) {
      Logger.log("PERINGATAN: tidak ada file jawaban terdeteksi di submission ini.");
    }

    const driveFileUrl = driveFileId
      ? "https://drive.google.com/file/d/" + driveFileId + "/view"
      : "";

    const payload = {
      kelasId: KELAS_ID,
      judulSoal: judulSoal,
      namaMahasiswa: namaMahasiswa,
      nim: nim,
      emailMahasiswa: emailMahasiswa,
      driveFileId: driveFileId,
      driveFileUrl: driveFileUrl,
      formResponseId: e.response.getId(),
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      headers: { "x-webhook-secret": WEBHOOK_SECRET },
      muteHttpExceptions: true,
    };

    const res = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("Webhook response (" + res.getResponseCode() + "): " + res.getContentText());
  } catch (err) {
    Logger.log("ERROR di onFormSubmit: " + err);
  }
}
`;
}