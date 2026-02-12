import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { AuditModule } from './modules/audit/audit.module';
import { ErpModule } from './modules/erp/erp.module';
import { EventBusModule } from './events/event-bus.module';
import { NetsisBridgeModule } from './modules/netsis/netsis-bridge.module';

@Module({
    imports: [
        // ── Configuration ──
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),

        // ── Event System (NestJS EventEmitter as RabbitMQ precursor) ──
        EventEmitterModule.forRoot({
            wildcard: true,
            delimiter: '.',
            maxListeners: 20,
            verboseMemoryLeak: true,
        }),

        // ── Infrastructure ──
        PrismaModule,
        EventBusModule,

        // ── Feature Modules ──
        MetadataModule,
        AuditModule,
        ErpModule,
        NetsisBridgeModule,
    ],
})
export class AppModule { }
