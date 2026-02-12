import { Controller, Get, Param } from '@nestjs/common';
import { MetadataService } from './metadata.service';

@Controller('metadata')
export class MetadataController {
    constructor(private readonly metadataService: MetadataService) { }

    @Get('entities')
    async listEntities() {
        const entities = await this.metadataService.listEntitySlugs();
        return { success: true, data: entities };
    }

    @Get(':entitySlug')
    async getEntitySchema(@Param('entitySlug') entitySlug: string) {
        const schema = await this.metadataService.getEntitySchema(entitySlug);
        return {
            success: true,
            data: schema,
            generatedAt: new Date().toISOString(),
        };
    }
}
