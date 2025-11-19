-- CreateEnum
CREATE TYPE "CardBrand" AS ENUM ('VISA', 'MASTERCARD', 'ELO', 'AMEX', 'OUTROS');

-- AlterTable
ALTER TABLE "SalePayment" ADD COLUMN     "brand" "CardBrand";

-- CreateTable
CREATE TABLE "MachineFee" (
    "id" SERIAL NOT NULL,
    "machineId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "brand" "CardBrand" NOT NULL,
    "feePercentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineFee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MachineFee" ADD CONSTRAINT "MachineFee_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineFee" ADD CONSTRAINT "MachineFee_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
