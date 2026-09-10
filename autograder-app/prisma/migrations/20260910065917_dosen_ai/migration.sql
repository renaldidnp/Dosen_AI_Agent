/*
  Warnings:

  - A unique constraint covering the columns `[submitToken]` on the table `Soal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `hasilkoreksi` ADD COLUMN `direviewOleh` VARCHAR(191) NULL,
    ADD COLUMN `reviewAktif` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `feedback` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `soal` ADD COLUMN `submitToken` VARCHAR(191) NULL,
    ADD COLUMN `submitTokenExpiry` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `GradingTrace` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `step` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `detail` VARCHAR(191) NULL,
    `provider` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `durationMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GradingTrace_submissionId_createdAt_idx`(`submissionId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Soal_submitToken_key` ON `Soal`(`submitToken`);

-- AddForeignKey
ALTER TABLE `GradingTrace` ADD CONSTRAINT `GradingTrace_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
