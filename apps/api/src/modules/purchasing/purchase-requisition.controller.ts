import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PurchaseRequisitionService } from './purchase-requisition.service';
import { CreatePurchaseRequisitionDto, UpdatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { PRStatus } from '@prisma/client';
import { Roles } from '../../common/guards/roles.guard';

@Controller('purchasing/requisitions')
@Roles('viewer')
export class PurchaseRequisitionController {
    constructor(private readonly service: PurchaseRequisitionService) { }

    @Roles('operator')
    @Post()
    create(@Body() dto: CreatePurchaseRequisitionDto) {
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

    @Roles('operator')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePurchaseRequisitionDto) {
        return this.service.update(id, dto);
    }

    @Roles('operator')
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() body: { status: PRStatus }) {
        return this.service.updateStatus(id, body.status);
    }

    @Roles('operator')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
