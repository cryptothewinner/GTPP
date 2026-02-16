import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, DefaultValuePipe, BadRequestException } from '@nestjs/common';
import { ProductionOrderService } from './production-order.service';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { ConfirmOperationDto } from './dto/confirm-operation.dto';
import { Roles } from '../../common/guards/roles.guard';

@Controller('production-orders')
@Roles('viewer')
export class ProductionOrderController {
    constructor(private readonly productionOrderService: ProductionOrderService) { }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(100), ParseIntPipe) pageSize: number,
        @Query('sortField') sortField?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('search') search?: string,
        @Query('filters') filters?: string,
    ) {
        return this.productionOrderService.findAll({
            page, pageSize: Math.min(pageSize, 500), sortField, sortOrder, search,
            filters: filters ? JSON.parse(filters) : undefined,
        });
    }

    @Get('summary')
    async getSummary() {
        return this.productionOrderService.getSummary();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productionOrderService.findOne(id);
    }

    @Post()
    @Roles('operator')
    async create(@Body() dto: CreateProductionOrderDto) {
        const order = await this.productionOrderService.create(dto);
        return { success: true, data: order };
    }

    @Patch(':id')
    @Roles('operator')
    async update(@Param('id') id: string, @Body() dto: UpdateProductionOrderDto) {
        const order = await this.productionOrderService.update(id, dto);
        return { success: true, data: order };
    }

    @Post(':id/start')
    @Roles('operator')
    async start(@Param('id') id: string) {
        const order = await this.productionOrderService.start(id);
        return { success: true, data: order };
    }

    @Post(':id/complete')
    @Roles('operator')
    async complete(@Param('id') id: string) {
        const order = await this.productionOrderService.complete(id);
        return { success: true, data: order };
    }
    @Get(':id/availability')
    async checkAvailability(@Param('id') id: string) {
        return this.productionOrderService.checkMaterialAvailability(id);
    }

    @Patch(':id/reschedule')
    @Roles('operator')
    async reschedule(@Param('id') id: string, @Body() dto: UpdateProductionOrderDto) {
        if (!dto.plannedStart || !dto.plannedEnd) {
            throw new BadRequestException('Başlangıç ve bitiş tarihleri zorunludur.');
        }
        return this.productionOrderService.reschedule(
            id,
            new Date(dto.plannedStart),
            new Date(dto.plannedEnd),
        );
    }

    @Post(':id/operations/:opId/confirm')
    @Roles('operator')
    async confirmOperation(
        @Param('id') id: string,
        @Param('opId') opId: string,
        @Body() dto: ConfirmOperationDto
    ) {
        return this.productionOrderService.confirmOperation(id, opId, dto);
    }
}
