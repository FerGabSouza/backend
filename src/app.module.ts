import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { SalesModule } from './sales/sales.module';
import { MachinesModule } from './machines/machines.module';



@Module({
  imports: [PrismaModule, ProductsModule, CategoriesModule, PaymentMethodsModule, SalesModule, MachinesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
