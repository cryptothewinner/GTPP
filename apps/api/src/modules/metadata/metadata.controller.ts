import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import type { EntityDefinitionDto } from '@sepenatural/shared';

@Controller('metadata')
export class MetadataController {
    constructor(private readonly metadataService: MetadataService) { }

    @Get('entities')
    async getAllDefinitions() {
        return this.metadataService.getAllDefinitions();
    }

    @Get('entities/:slug')
    async getDefinitionBySlug(@Param('slug') slug: string) {
        return this.metadataService.getDefinitionBySlug(slug);
    }

    @Post('entities')
    async createDefinition(@Body() data: Partial<EntityDefinitionDto>) {
        return this.metadataService.createDefinition(data);
    }
}
