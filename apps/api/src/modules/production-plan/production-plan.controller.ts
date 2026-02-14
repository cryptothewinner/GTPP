import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductionPlanService } from './production-plan.service';
import { CreateProductionPlanDto } from './dto/create-production-plan.dto';

@Controller('production-plans')
export class ProductionPlanController {
    constructor(private readonly productionPlanService: ProductionPlanService) { }

    @Get()
    findAll() {
        return this.productionPlanService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productionPlanService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateProductionPlanDto) {
        return this.productionPlanService.create(dto);
    }
}
