import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { SalesQuotationService } from './sales-quotation.service';
import { CreateSalesQuotationDto } from './dto/create-sales-quotation.dto';
import { UpdateSalesQuotationDto } from './dto/update-sales-quotation.dto';

@Controller('sales-quotations')
export class SalesQuotationController {
    constructor(private readonly service: SalesQuotationService) { }

    @Post()
    create(@Body() dto: CreateSalesQuotationDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateSalesQuotationDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }

    @Post(':id/convert')
    convert(
        @Param('id') id: string,
        @Body() body: { salesOrgId?: string; plantId?: string },
    ) {
        return this.service.convertToOrder(id, body.salesOrgId, body.plantId);
    }
}
