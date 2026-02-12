import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntityDefinitionDto, FieldDefinition, FieldGroup } from '@sepenatural/shared';

@Injectable()
export class MetadataService {
    private readonly logger = new Logger(MetadataService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getAllDefinitions(): Promise<EntityDefinitionDto[]> {
        const definitions = await this.prisma.entityDefinition.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        return definitions.map(d => ({
            id: d.id,
            slug: d.slug,
            name: d.name,
            displayName: d.name,
            description: d.description ?? undefined,
            icon: d.icon ?? undefined,
            fields: d.fields as unknown as FieldDefinition[],
            fieldGroups: d.fieldGroups as unknown as FieldGroup[],
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
        }));
    }

    async getDefinitionBySlug(slug: string): Promise<EntityDefinitionDto> {
        const d = await this.prisma.entityDefinition.findUnique({
            where: { slug },
        });

        if (!d || !d.isActive) {
            throw new NotFoundException(`Entity definition with slug "${slug}" not found`);
        }

        return {
            id: d.id,
            slug: d.slug,
            name: d.name,
            displayName: d.name,
            description: d.description ?? undefined,
            icon: d.icon ?? undefined,
            fields: d.fields as unknown as FieldDefinition[],
            fieldGroups: d.fieldGroups as unknown as FieldGroup[],
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
        };
    }

    async createDefinition(data: Partial<EntityDefinitionDto>): Promise<EntityDefinitionDto> {
        if (!data.slug || !data.name) {
            throw new ConflictException('Slug and Name are required');
        }

        const existing = await this.prisma.entityDefinition.findUnique({
            where: { slug: data.slug },
        });

        if (existing) {
            throw new ConflictException(`Entity definition with slug "${data.slug}" already exists`);
        }

        const d = await this.prisma.entityDefinition.create({
            data: {
                slug: data.slug,
                name: data.name,
                description: data.description,
                icon: data.icon,
                fields: (data.fields ?? []) as any,
                fieldGroups: (data.fieldGroups ?? []) as any,
            },
        });

        return {
            id: d.id,
            slug: d.slug,
            name: d.name,
            displayName: d.name,
            description: d.description ?? undefined,
            icon: d.icon ?? undefined,
            fields: d.fields as unknown as FieldDefinition[],
            fieldGroups: d.fieldGroups as unknown as FieldGroup[],
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
        };
    }
}
