import {
    Controller, Get, Post, Body, Query, ParseIntPipe, DefaultValuePipe
} from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementType } from '@prisma/client';
import { Public } from '../../auth/jwt-auth.guard';

@Controller('stock-movements')
export class StockMovementController {
    constructor(private readonly stockMovementService: StockMovementService) {}

    @Get('summary')
    @Public()
    getSummary() {
        return this.stockMovementService.getSummary();
    }

    @Get('recent')
    @Public()
    getRecentMovements(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.stockMovementService.getRecentMovements(limit);
    }

    @Get()
    @Public()
    findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
        @Query('search') search?: string,
        @Query('type') type?: StockMovementType,
    ) {
        return this.stockMovementService.findAll({ page, pageSize, search, type });
    }

    @Post()
    @Public()
    create(@Body() dto: CreateStockMovementDto) {
        return this.stockMovementService.create(dto);
    }
}
