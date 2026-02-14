import { Module } from '@nestjs/common';
import { BusinessPartnerService } from './business-partner.service';
import { BusinessPartnerController } from './business-partner.controller';

@Module({
    controllers: [BusinessPartnerController],
    providers: [BusinessPartnerService],
    exports: [BusinessPartnerService],
})
export class BusinessPartnerModule { }
