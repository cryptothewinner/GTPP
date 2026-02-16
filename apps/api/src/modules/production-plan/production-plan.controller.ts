import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductionPlanService } from './production-plan.service';
import { CreateProductionPlanDto } from './dto/create-production-plan.dto';
import { Roles } from '../../common/guards/roles.guard';

@Controller('production-plans')
@Roles('viewer')
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
    @Roles('operator', 'admin')
    create(@Body() dto: CreateProductionPlanDto) {
        return this.productionPlanService.create(dto);
    }
}
