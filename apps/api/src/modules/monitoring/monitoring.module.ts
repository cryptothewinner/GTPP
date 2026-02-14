import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ServiceLogService } from './service-log.service';
import { MonitoringController } from './monitoring.controller';
import { HttpLoggingInterceptor } from './http-logging.interceptor';

@Global()
@Module({
    controllers: [MonitoringController],
    providers: [
        ServiceLogService,
        {
            provide: APP_INTERCEPTOR,
            useClass: HttpLoggingInterceptor,
        },
    ],
    exports: [ServiceLogService],
})
export class MonitoringModule {}
