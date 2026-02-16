import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { Roles } from '../../common/guards/roles.guard';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
@Roles('viewer')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('pageSize', new DefaultValuePipe(100), ParseIntPipe) pageSize: number,
        @Query('sortField') sortField?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('search') search?: string,
        @Query('filters') filters?: string,
    ) {
        return this.productService.findAll({
            page, pageSize: Math.min(pageSize, 500), sortField, sortOrder, search,
            filters: filters ? JSON.parse(filters) : undefined,
        });
    }

    @Get('summary')
    async getSummary() {
        return this.productService.getSummary();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.productService.findOne(id);
    }

    @Roles('operator')
    @Post()
    async create(@Body() dto: CreateProductDto) {
        const product = await this.productService.create(dto);
        return { success: true, data: product };
    }

    @Roles('operator')
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        const product = await this.productService.update(id, dto);
        return { success: true, data: product };
    }
}
