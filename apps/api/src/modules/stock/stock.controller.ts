import { Controller, Get, Patch, Param, Body, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { StockService } from './stock.service';
import { UpdateStockDto } from './dto/update-stock.dto';

@Controller('stocks')
export class StockController {
    constructor(private readonly stockService: StockService) { }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(100), ParseIntPipe) pageSize: number,
        @Query('sortField') sortField?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('search') search?: string,
        @Query('filters') filters?: string, // JSON string of column filters
    ) {
        return this.stockService.findAll({
            page,
            pageSize: Math.min(pageSize, 500), // Cap at 500
            sortField,
            sortOrder, search,
            filters: filters ? JSON.parse(filters) : undefined,
        });
    }

    @Get('summary')
    async getSummary() {
        return this.stockService.getSummary();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.stockService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateStockDto) {
        const stock = await this.stockService.update(id, dto);
        return { success: true, data: stock };
    }
}
