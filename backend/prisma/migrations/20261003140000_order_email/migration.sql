-- AlterTable: email покупателя (для связи и отправки трек-номера).
-- Колонка nullable: у уже оформленных заказов email нет.
ALTER TABLE "Order" ADD COLUMN "email" TEXT;
