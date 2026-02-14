import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto, CreatePurchaseOrderFromRequisitionDto, UpdatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { POStatus } from '@prisma/client';

@Controller('purchasing/orders')
export class PurchaseOrderController {
    constructor(private readonly service: PurchaseOrderService) { }

    @Post()
    create(@Body() dto: CreatePurchaseOrderDto) {
        return this.service.create(dto);
    }

    @Post('from-requisition/:id')
    createFromRequisition(@Param('id') id: string, @Body() dto: CreatePurchaseOrderFromRequisitionDto) {
        return this.service.createFromRequisition(id, dto);
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
    update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
        return this.service.update(id, dto);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() body: { status: POStatus }) {
        return this.service.updateStatus(id, body.status);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }

    @Get('meta/purchasing-orgs')
    getPurchasingOrgs() {
        return this.service.findAllPurchasingOrgs();
    }

    @Get('meta/purchasing-groups')
    getPurchasingGroups() {
        return this.service.findAllPurchasingGroups();
    }

    @Get('meta/company-codes')
    getCompanyCodes() {
        return this.service.findAllCompanyCodes();
    }
}
