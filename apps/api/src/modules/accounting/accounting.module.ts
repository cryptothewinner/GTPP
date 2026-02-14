import { Module, Global } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccountDeterminationService } from './account-determination.service';

@Global() // Make it global so InvoiceService can use AccountService easily
@Module({
    imports: [PrismaModule],
    controllers: [AccountingController],
    providers: [AccountingService, AccountDeterminationService],
    exports: [AccountingService, AccountDeterminationService],
})
export class AccountingModule { }
