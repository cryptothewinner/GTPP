import { Module } from '@nestjs/common';
import { PurchaseRequisitionService } from './purchase-requisition.service';
import { PurchaseRequisitionController } from './purchase-requisition.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PurchaseRequisitionController, PurchaseOrderController],
    providers: [PurchaseRequisitionService, PurchaseOrderService],
    exports: [PurchaseRequisitionService, PurchaseOrderService],
})
export class PurchasingModule { }
