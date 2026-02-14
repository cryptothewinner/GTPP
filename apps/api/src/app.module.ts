import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StockModule } from './modules/stock/stock.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { MaterialModule } from './modules/material/material.module';
import { ProductModule } from './modules/product/product.module';
import { RecipeModule } from './modules/recipe/recipe.module';
import { ProductionOrderModule } from './modules/production-order/production-order.module';
import { ProductionBatchModule } from './modules/production-batch/production-batch.module';
import { MaterialBatchModule } from './modules/material-batch/material-batch.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StockMovementModule } from './modules/stock-movement/stock-movement.module';
import { ProductionStructureModule } from './modules/production-structure/production-structure.module';
import { HealthController } from './health.controller';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

import { PerformanceController } from './modules/performance/performance.controller';
import { PerformanceMetricsService } from './modules/performance/performance-metrics.service';

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
        SupplierModule,
        MaterialModule,
        ProductModule,
        RecipeModule,
        ProductionOrderModule,
        ProductionBatchModule,
        MaterialBatchModule,
        DashboardModule,
        StockMovementModule,
        ProductionStructureModule,
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
