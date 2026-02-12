import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NetsisBridgeService implements OnModuleInit {
    private readonly logger = new Logger(NetsisBridgeService.name);
    private readonly bridgeUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.bridgeUrl = this.configService.get<string>('NETSIS_BRIDGE_URL', 'http://localhost:5295');
    }

    async onModuleInit() {
        await this.pingBridge();
    }

    async pingBridge(): Promise<boolean> {
        try {
            this.logger.log(`Pinging Netsis Bridge at ${this.bridgeUrl}/health...`);
            const response = await firstValueFrom(
                this.httpService.get(`${this.bridgeUrl}/health`),
            );
            this.logger.log(`✅ Netsis Bridge is online: ${JSON.stringify(response.data)}`);
            return true;
        } catch (error) {
            this.logger.error(`❌ Netsis Bridge is unreachable: ${error.message}`);
            return false;
        }
    }

    async getHealth() {
        const response = await firstValueFrom(
            this.httpService.get(`${this.bridgeUrl}/health`),
        );
        return response.data;
    }
}
