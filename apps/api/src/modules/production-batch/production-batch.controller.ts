import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ProductionBatchService } from './production-batch.service';
import { CreateProductionBatchDto } from './dto/create-production-batch.dto';
import { UpdateProductionBatchDto } from './dto/update-production-batch.dto';

@Controller('production-batches')
export class ProductionBatchController {
    constructor(private readonly productionBatchService: ProductionBatchService) { }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(100), ParseIntPipe) pageSize: number,
        @Query('sortField') sortField?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('search') search?: string,
        @Query('filters') filters?: string,
    ) {
        return this.productionBatchService.findAll({
            page, pageSize: Math.min(pageSize, 500), sortField, sortOrder, search,
            filters: filters ? JSON.parse(filters) : undefined,
        });
    }

    @Get('summary')
    async getSummary() {
        return this.productionBatchService.getSummary();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const batch = await this.productionBatchService.findOne(id);
        return { success: true, data: batch };
    }

    @Post()
    async create(@Body() dto: CreateProductionBatchDto) {
        const batch = await this.productionBatchService.create(dto);
        return { success: true, data: batch };
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateProductionBatchDto) {
        const batch = await this.productionBatchService.update(id, dto);
        return { success: true, data: batch };
    }

    @Post(':id/qc-pass')
    async qcPass(@Param('id') id: string) {
        const batch = await this.productionBatchService.qcPass(id);
        return { success: true, data: batch };
    }

    @Post(':id/qc-fail')
    async qcFail(@Param('id') id: string, @Body() body: { qcNotes?: string }) {
        const batch = await this.productionBatchService.qcFail(id, body.qcNotes);
        return { success: true, data: batch };
    }

    @Post(':id/release')
    async release(@Param('id') id: string) {
        const batch = await this.productionBatchService.release(id);
        return { success: true, data: batch };
    }
}
