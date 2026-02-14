import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './modules/stock/stock.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { BusinessPartnerModule } from './modules/business-partner/business-partner.module';
import { MaterialModule } from './modules/material/material.module';
import { ProductModule } from './modules/product/product.module';
import { RecipeModule } from './modules/recipe/recipe.module';
import { ProductionOrderModule } from './modules/production-order/production-order.module';
import { ProductionBatchModule } from './modules/production-batch/production-batch.module';
import { MaterialBatchModule } from './modules/material-batch/material-batch.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StockMovementModule } from './modules/stock-movement/stock-movement.module';
import { PlantHierarchyModule } from './modules/plant-hierarchy/plant-hierarchy.module';
import { ProductionPlanModule } from './modules/production-plan/production-plan.module';
import { PurchasingModule } from './modules/purchasing/purchasing.module';
import { MaterialDocumentModule } from './modules/material-document/material-document.module';
import { ProcessDefinitionModule } from './modules/process-definition/process-definition.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { HealthController } from './health.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

import { PerformanceController } from './modules/performance/performance.controller';
import { PerformanceMetricsService } from './modules/performance/performance-metrics.service';
import { RoutingModule } from './modules/routing/routing.module';
import { SalesQuotationModule } from './modules/sales-quotation/sales-quotation.module';
import { SalesOrderModule } from './modules/sales-order/sales-order.module';
import { OutboundDeliveryModule } from './modules/outbound-delivery/outbound-delivery.module';
import { BillingModule } from './modules/billing/billing.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { SupplierModule } from './modules/supplier/supplier.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        AuthModule,
        StockModule,
        MetadataModule,
        InventoryModule,
        BusinessPartnerModule,
        MaterialModule,
        ProductModule,
        RecipeModule,
        ProductionOrderModule,
        ProductionBatchModule,
        MaterialBatchModule,
        DashboardModule,
        StockMovementModule,
        // Production structure canonical contract: PlantHierarchy + ProductionPlan endpoints.
        PlantHierarchyModule,
        ProductionPlanModule,
        PurchasingModule,
        MaterialDocumentModule,
        ProcessDefinitionModule,
        MonitoringModule,
        RoutingModule,
        SalesQuotationModule,
        SalesOrderModule,
        OutboundDeliveryModule,
        BillingModule,
        AccountingModule,
        SupplierModule,
    ],
    controllers: [HealthController, PerformanceController],
    providers: [
        PerformanceMetricsService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule { }
