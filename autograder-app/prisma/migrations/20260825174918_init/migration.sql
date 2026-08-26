-- CreateTable
CREATE TABLE `Dosen` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Dosen_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Soal` (
    `id` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `dosenId` VARCHAR(191) NOT NULL,
    `googleFormId` VARCHAR(191) NULL,
    `googleFormUrl` VARCHAR(191) NULL,
    `driveFolderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Indikator` (
    `id` VARCHAR(191) NOT NULL,
    `soalId` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `bobot` DOUBLE NOT NULL,
    `rubrik` VARCHAR(191) NOT NULL,
    `skorMax` DOUBLE NOT NULL DEFAULT 100,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `soalId` VARCHAR(191) NOT NULL,
    `namaMahasiswa` VARCHAR(191) NOT NULL,
    `nim` VARCHAR(191) NOT NULL,
    `emailMahasiswa` VARCHAR(191) NOT NULL,
    `driveFileId` VARCHAR(191) NOT NULL,
    `driveFileUrl` VARCHAR(191) NOT NULL,
    `formResponseId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'diterima',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Submission_formResponseId_key`(`formResponseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HasilKoreksi` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `skorTotal` DOUBLE NOT NULL,
    `skorPerIndikator` JSON NOT NULL,
    `feedback` VARCHAR(191) NOT NULL,
    `emailTerkirim` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HasilKoreksi_submissionId_key`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Soal` ADD CONSTRAINT `Soal_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `Dosen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Indikator` ADD CONSTRAINT `Indikator_soalId_fkey` FOREIGN KEY (`soalId`) REFERENCES `Soal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_soalId_fkey` FOREIGN KEY (`soalId`) REFERENCES `Soal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HasilKoreksi` ADD CONSTRAINT `HasilKoreksi_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
