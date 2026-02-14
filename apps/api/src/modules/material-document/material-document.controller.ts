import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MaterialDocumentService } from './material-document.service';
import { CreateMaterialDocumentDto } from './dto/create-material-document.dto';

@Controller('inventory/material-documents')
export class MaterialDocumentController {
    constructor(private readonly service: MaterialDocumentService) { }

    @Post()
    create(@Body() dto: CreateMaterialDocumentDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get('material/:materialId')
    findByMaterial(@Param('materialId') materialId: string) {
        return this.service.findByMaterial(materialId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }
}
