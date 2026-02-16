import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto, CreatePurchaseOrderFromRequisitionDto, UpdatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { POStatus } from '@prisma/client';
import { Roles } from '../../common/guards/roles.guard';

@Controller('purchasing/orders')
@Roles('viewer')
export class PurchaseOrderController {
    constructor(private readonly service: PurchaseOrderService) { }

    @Roles('production_manager')
    @Post()
    create(@Body() dto: CreatePurchaseOrderDto) {
        return this.service.create(dto);
    }

    @Roles('production_manager')
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

    @Roles('production_manager')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
        return this.service.update(id, dto);
    }

    @Roles('production_manager')
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() body: { status: POStatus }) {
        return this.service.updateStatus(id, body.status);
    }

    @Roles('production_manager')
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
