import {
    Controller, Get, Post, Body, Query, ParseIntPipe, DefaultValuePipe
} from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementType } from '@prisma/client';
import { Roles } from '../../common/guards/roles.guard';

@Controller('stock-movements')
@Roles('viewer')
export class StockMovementController {
    constructor(private readonly stockMovementService: StockMovementService) {}

    @Get('summary')
    getSummary() {
        return this.stockMovementService.getSummary();
    }

    @Get('recent')
    getRecentMovements(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.stockMovementService.getRecentMovements(limit);
    }

    @Get()
    findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
        @Query('search') search?: string,
        @Query('type') type?: StockMovementType,
    ) {
        return this.stockMovementService.findAll({ page, pageSize, search, type });
    }

    @Post()
    @Roles('operator')
    create(@Body() dto: CreateStockMovementDto) {
        return this.stockMovementService.create(dto);
    }
}
