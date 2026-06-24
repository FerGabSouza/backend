-- AlterTable: Add unique constraint to Category.name
ALTER TABLE "Category" ADD CONSTRAINT "Category_name_key" UNIQUE ("name");

