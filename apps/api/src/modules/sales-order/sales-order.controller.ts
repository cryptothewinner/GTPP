import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { SalesOrderService } from './sales-order.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';

@Controller('sales-orders')
export class SalesOrderController {
    constructor(private readonly salesOrderService: SalesOrderService) { }

    @Get('meta/sales-orgs')
    findAllSalesOrgs() {
        return this.salesOrderService.findAllSalesOrgs();
    }

    @Post()
    create(@Body() dto: CreateSalesOrderDto) {
        return this.salesOrderService.create(dto);
    }

    @Get()
    findAll() {
        return this.salesOrderService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.salesOrderService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
        return this.salesOrderService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.salesOrderService.remove(id);
    }
}
