import { google, forms_v1 } from "googleapis";

function getFormsClient() {
  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.forms({ version: "v1", auth: oauth2Client });
}

const DROPDOWN_TITLE = "Pilih Soal/Tugas";

/**
 * Membuat Google Form baru untuk satu Kelas, lengkap dengan field:
 * Nama Mahasiswa, NIM, Email, dan dropdown "Pilih Soal/Tugas" (kosong).
 *
 * CATATAN PENTING: field "Upload File Jawaban" TIDAK dibuat di sini.
 * Google Forms API resmi tidak mendukung pembuatan file-upload question
 * (lihat governance Schema$FileUploadQuestion dari googleapis: "The API
 * currently does not support creating file upload questions"). Field ini
 * harus ditambahkan MANUAL oleh dosen sekali saja setelah form dibuat.
 */
export async function createKelasForm(
  namaKelas: string,
  angkatan: string,
): Promise<{ formId: string; formUrl: string; editUrl: string }> {
  const forms = getFormsClient();

  // 1. Buat form kosong — forms.create HANYA menerima info.title, field lain diabaikan.
  const created = await forms.forms.create({
    requestBody: {
      info: {
        title: `Submit Tugas - ${namaKelas} ${angkatan}`,
      },
    },
  });

  const formId = created.data.formId;
  if (!formId) {
    throw new Error("Gagal membuat Google Form: formId tidak dikembalikan API.");
  }

  // 2. Tambahkan pertanyaan lewat batchUpdate (create tidak bisa sekaligus isi field).
  const requests: forms_v1.Schema$Request[] = [
    {
      createItem: {
        item: {
          title: "Nama Mahasiswa",
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 0 },
      },
    },
    {
      createItem: {
        item: {
          title: "NIM",
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 1 },
      },
    },
    {
      createItem: {
        item: {
          title: "Email",
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 2 },
      },
    },
    {
      createItem: {
        item: {
          title: DROPDOWN_TITLE,
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: "DROP_DOWN",
                // Google Forms tidak mengizinkan choiceQuestion dengan options kosong,
                // jadi diisi 1 placeholder dulu — akan otomatis "tenggelam" begitu
                // soal pertama ditambahkan lewat addSoalToFormDropdown().
                options: [{ value: "(Belum ada soal — hubungi dosen)" }],
              },
            },
          },
        },
        location: { index: 3 },
      },
    },
  ];

  await forms.forms.batchUpdate({
    formId,
    requestBody: { requests },
  });

  const formUrl = `https://docs.google.com/forms/d/${formId}/viewform`;
  const editUrl = `https://docs.google.com/forms/d/${formId}/edit`;

  return { formId, formUrl, editUrl };
}

/**
 * Menambahkan satu judul soal baru sebagai opsi dropdown "Pilih Soal/Tugas"
 * pada form milik sebuah Kelas. Idempotent: kalau judul sudah ada di
 * dropdown, tidak akan ditambahkan dobel.
 */
export async function addSoalToFormDropdown(formId: string, judulSoal: string): Promise<void> {
  const forms = getFormsClient();

  const form = await forms.forms.get({ formId });
  const items = form.data.items ?? [];

  const dropdownItem = items.find((item) => item.title === DROPDOWN_TITLE && item.questionItem?.question?.choiceQuestion);

  if (!dropdownItem || !dropdownItem.itemId) {
    throw new Error(
      `Field dropdown "${DROPDOWN_TITLE}" tidak ditemukan di form ${formId}. Form mungkin sudah diedit manual dan mengubah judul field ini.`,
    );
  }

  const question = dropdownItem.questionItem!.question!;
  const currentOptions = question.choiceQuestion?.options ?? [];

  const alreadyExists = currentOptions.some((opt) => opt.value === judulSoal);
  if (alreadyExists) return;

  // Buang placeholder default kalau ini soal pertama yang ditambahkan.
  const cleanedOptions = currentOptions.filter((opt) => opt.value !== "(Belum ada soal — hubungi dosen)");

  const newOptions = [...cleanedOptions, { value: judulSoal }];

  await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [
        {
          updateItem: {
            item: {
              itemId: dropdownItem.itemId,
              title: DROPDOWN_TITLE,
              questionItem: {
                question: {
                  questionId: question.questionId,
                  required: true,
                  choiceQuestion: {
                    type: "DROP_DOWN",
                    options: newOptions,
                  },
                },
              },
            },
            location: { index: items.indexOf(dropdownItem) },
            updateMask: "title,questionItem.question.choiceQuestion.options",
          },
        },
      ],
    },
  });
}