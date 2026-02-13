import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { MaterialService } from './material.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Controller('materials')
export class MaterialController {
    constructor(private readonly materialService: MaterialService) { }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(100), ParseIntPipe) pageSize: number,
        @Query('sortField') sortField?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('search') search?: string,
        @Query('filters') filters?: string,
    ) {
        return this.materialService.findAll({
            page, pageSize: Math.min(pageSize, 500), sortField, sortOrder, search,
            filters: filters ? JSON.parse(filters) : undefined,
        });
    }

    @Get('summary')
    async getSummary() {
        return this.materialService.getSummary();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.materialService.findOne(id);
    }

    @Post('sync-batches')
    async syncBatches() {
        return this.materialService.syncInitialBatches();
    }

    @Post()
    async create(@Body() dto: CreateMaterialDto) {
        const material = await this.materialService.create(dto);
        return { success: true, data: material };
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
        const material = await this.materialService.update(id, dto);
        return { success: true, data: material };
    }
}
