/*
  Warnings:

  - A unique constraint covering the columns `[accessToken]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.
  - The required column `accessToken` was added to the `Submission` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- Step 1: tambah kolom nullable dulu
ALTER TABLE `Submission` ADD COLUMN `accessToken` VARCHAR(191) NULL;

-- Step 2: isi 18 row lama dengan token acak (pakai UUID bawaan MySQL)
UPDATE `Submission` SET `accessToken` = UUID() WHERE `accessToken` IS NULL;

-- Step 3: kunci jadi wajib + unique
ALTER TABLE `Submission` MODIFY `accessToken` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `Submission_accessToken_key` ON `Submission`(`accessToken`);