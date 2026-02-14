import { Module } from '@nestjs/common';
import { ProductionOrderController } from './production-order.controller';
import { ProductionOrderService } from './production-order.service';
import { ProductionOrderLifecycleOrchestrator } from './production-order-lifecycle.orchestrator';
import { ProductionOrderStatusPolicy } from './production-order-status.policy';
import { MaterialDocumentModule } from '../material-document/material-document.module';

@Module({
    imports: [MaterialDocumentModule],
    controllers: [ProductionOrderController],
    providers: [ProductionOrderService, ProductionOrderLifecycleOrchestrator, ProductionOrderStatusPolicy],
    exports: [ProductionOrderService],
})
export class ProductionOrderModule { }
