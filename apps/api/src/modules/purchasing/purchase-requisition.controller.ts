import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PurchaseRequisitionService } from './purchase-requisition.service';
import { CreatePurchaseRequisitionDto, UpdatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { PRStatus } from '@prisma/client';

@Controller('purchasing/requisitions')
export class PurchaseRequisitionController {
    constructor(private readonly service: PurchaseRequisitionService) { }

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

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePurchaseRequisitionDto) {
        return this.service.update(id, dto);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() body: { status: PRStatus }) {
        return this.service.updateStatus(id, body.status);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
