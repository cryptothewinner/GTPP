import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { SalesOrderService } from './sales-order.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { Roles } from '../../common/guards/roles.guard';

@Controller('sales-orders')
@Roles('viewer')
export class SalesOrderController {
    constructor(private readonly salesOrderService: SalesOrderService) { }

    @Get('meta/sales-orgs')
    findAllSalesOrgs() {
        return this.salesOrderService.findAllSalesOrgs();
    }

    @Post()
    @Roles('operator')
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
    @Roles('operator')
    update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
        return this.salesOrderService.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.salesOrderService.remove(id);
    }
}
