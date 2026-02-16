import { Controller, Get, Post, Body } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateGLAccountDto } from './dto/create-gl-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { Roles } from '../../common/guards/roles.guard';

@Controller('accounting')
@Roles('viewer')
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) { }

    @Post('gl-accounts')
    @Roles('admin')
    createGL(@Body() dto: CreateGLAccountDto) {
        return this.accountingService.createGLAccount(dto);
    }

    @Get('gl-accounts')
    findAllGL() {
        return this.accountingService.findAllGLAccounts();
    }

    @Post('journal-entries')
    @Roles('admin')
    createJournal(@Body() dto: CreateJournalEntryDto) {
        return this.accountingService.createJournalEntry(dto);
    }

    @Get('journal-entries')
    findAllJournals() {
        return this.accountingService.findAllJournalEntries();
    }
}
