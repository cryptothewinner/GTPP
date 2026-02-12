import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ErpService } from './erp.service';
import { ERP_ADAPTER_PORT } from './ports/erp-adapter.port';
import { MockNetsisAdapter } from './adapters/mock-netsis.adapter';
import { NetsisBridgeAdapter } from './adapters/netsis-bridge.adapter';

/**
 * ErpModule — Netsis Integration Layer
 *
 * Uses the Adapter Pattern (Hexagonal Architecture) to decouple
 * business logic from the ERP communication mechanism.
 *
 * The adapter is selected based on the environment:
 * - Development: MockNetsisAdapter (returns realistic fake data)
 * - Production: NetsisBridgeAdapter (calls the .NET Bridge service)
 */
@Module({
    imports: [ConfigModule],
    providers: [
        ErpService,
        {
            provide: ERP_ADAPTER_PORT,
            useFactory: (config: ConfigService) => {
                const env = config.get<string>('NODE_ENV', 'development');
                const bridgeUrl = config.get<string>('NETSIS_BRIDGE_URL');

                if (env === 'production' && bridgeUrl) {
                    return new NetsisBridgeAdapter(bridgeUrl, config.get('NETSIS_BRIDGE_API_KEY', ''));
                }

                return new MockNetsisAdapter();
            },
            inject: [ConfigService],
        },
    ],
    exports: [ErpService],
})
export class ErpModule { }
