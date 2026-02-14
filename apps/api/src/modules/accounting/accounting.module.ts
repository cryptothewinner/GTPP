import { Module, Global } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global() // Make it global so InvoiceService can use AccountService easily
@Module({
    imports: [PrismaModule],
    controllers: [AccountingController],
    providers: [AccountingService],
    exports: [AccountingService],
})
export class AccountingModule { }
