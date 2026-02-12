import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NetsisBridgeService } from './netsis-bridge.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        HttpModule.register({
            timeout: 5000,
            maxRedirects: 5,
        }),
        ConfigModule,
    ],
    providers: [NetsisBridgeService],
    exports: [NetsisBridgeService],
})
export class NetsisBridgeModule { }
