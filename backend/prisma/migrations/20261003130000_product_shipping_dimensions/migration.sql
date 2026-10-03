-- AlterTable: вес и габариты товара для доставки (только админка, на сайте не показываются).
-- Колонки nullable: у уже существующих товаров значений пока нет, их заполняют в админке.
ALTER TABLE "Product" ADD COLUMN "weightGrams" INTEGER,
ADD COLUMN "lengthCm" INTEGER,
ADD COLUMN "widthCm" INTEGER,
ADD COLUMN "heightCm" INTEGER;
