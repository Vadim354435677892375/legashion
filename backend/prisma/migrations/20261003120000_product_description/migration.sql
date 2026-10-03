-- AlterTable: поле «описание» для админки (density/composition не трогаем — их использует сайт)
ALTER TABLE "Product" ADD COLUMN "description" TEXT;
