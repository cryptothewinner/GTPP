import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Controller('invoices')
export class InvoiceController {
    constructor(private readonly service: InvoiceService) { }

    @Post()
    create(@Body() dto: CreateInvoiceDto) {
        return this.service.create(dto);
    }

    @Post(':id/post')
    postToAccounting(@Param('id') id: string) {
        return this.service.postToAccounting(id);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }
}
