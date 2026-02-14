import { Module } from '@nestjs/common';
import { OutboundDeliveryService } from './outbound-delivery.service';
import { OutboundDeliveryController } from './outbound-delivery.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MaterialDocumentModule } from '../material-document/material-document.module';

@Module({
    imports: [PrismaModule, MaterialDocumentModule],
    controllers: [OutboundDeliveryController],
    providers: [OutboundDeliveryService],
    exports: [OutboundDeliveryService],
})
export class OutboundDeliveryModule { }
