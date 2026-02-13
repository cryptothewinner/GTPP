
import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { MaterialBatchService } from './material-batch.service';
import { CreateMaterialBatchDto } from './dto/create-material-batch.dto';

@Controller('material-batches')
export class MaterialBatchController {
    constructor(private readonly materialBatchService: MaterialBatchService) { }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(100), ParseIntPipe) pageSize: number,
        @Query('sortField') sortField?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('search') search?: string,
        @Query('filters') filters?: string,
    ) {
        return this.materialBatchService.findAll({
            page, pageSize: Math.min(pageSize, 500), sortField, sortOrder, search,
            filters: filters ? JSON.parse(filters) : undefined,
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.materialBatchService.findOne(id);
    }

    @Post()
    async create(@Body() createMaterialBatchDto: CreateMaterialBatchDto) {
        return this.materialBatchService.create(createMaterialBatchDto);
    }
}
