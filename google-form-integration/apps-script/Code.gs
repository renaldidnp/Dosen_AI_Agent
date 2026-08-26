/**
 * Trigger otomatis tiap ada submit Google Form.
 * Harus di-set manual di Apps Script: Triggers > Add Trigger >
 *   Function: onFormSubmit
 *   Event source: From form
 *   Event type: On form submit
 */
function onFormSubmit(e) {
  try {
    const itemResponses = e.response.getItemResponses();

    // Sesuai urutan pertanyaan di form-template/README.md
    const namaMahasiswa = itemResponses[0].getResponse();
    const nim = itemResponses[1].getResponse();
    const emailMahasiswa = itemResponses[2].getResponse();
    const namaSoal = itemResponses[3].getResponse();

    // Pertanyaan file upload mengembalikan ARRAY berisi file_id (bisa lebih dari satu file)
    const fileUploadResponse = itemResponses[4].getResponse();
    const fileId = Array.isArray(fileUploadResponse) ? fileUploadResponse[0] : fileUploadResponse;

    const file = DriveApp.getFileById(fileId);
    const driveFileUrl = file.getUrl();

    const soalId = SOAL_ID_MAP[namaSoal];
    if (!soalId) {
      Logger.log("SOAL_ID tidak ditemukan untuk: " + namaSoal);
      return;
    }

    const formResponseId = e.response.getId();

    const payload = {
      namaMahasiswa: namaMahasiswa,
      nim: nim,
      emailMahasiswa: emailMahasiswa,
      soalId: soalId,
      driveFileId: fileId,
      driveFileUrl: driveFileUrl,
      formResponseId: formResponseId,
    };

    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true, // biar error response tetap kebaca, nggak langsung throw
    });

    Logger.log("Webhook response: " + response.getContentText());

    if (response.getResponseCode() !== 200) {
      // Opsional: kirim email notifikasi ke diri sendiri (dosen/admin) kalau webhook gagal
      MailApp.sendEmail({
        to: "admin-email-kamu@gmail.com",
        subject: "Autograder Webhook Gagal",
        body: "Submission dari " + namaMahasiswa + " gagal dikirim ke webhook.\n\n" + "Response: " + response.getContentText(),
      });
    }
  } catch (err) {
    Logger.log("Error di onFormSubmit: " + err.message);
    MailApp.sendEmail({
      to: "admin-email-kamu@gmail.com",
      subject: "Autograder Webhook Error",
      body: "Terjadi error saat memproses submission:\n\n" + err.message,
    });
  }
}
