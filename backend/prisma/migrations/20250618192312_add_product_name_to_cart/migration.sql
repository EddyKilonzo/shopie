/*
  Warnings:

  - Added the required column `productName` to the `Cart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "productName" TEXT NOT NULL;
