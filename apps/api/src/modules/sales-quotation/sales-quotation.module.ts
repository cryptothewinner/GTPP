import { Module } from '@nestjs/common';
import { SalesQuotationService } from './sales-quotation.service';
import { SalesQuotationController } from './sales-quotation.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { SalesOrderModule } from '../sales-order/sales-order.module';

@Module({
    imports: [PrismaModule, SalesOrderModule],
    controllers: [SalesQuotationController],
    providers: [SalesQuotationService],
    exports: [SalesQuotationService],
})
export class SalesQuotationModule { }
