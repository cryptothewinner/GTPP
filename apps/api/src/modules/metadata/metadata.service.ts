import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { EntityFormSchema, FieldMetadata as SharedFieldMetadata, FieldGroup as SharedFieldGroup } from '@sepenatural/shared';

@Injectable()
export class MetadataService {
    constructor(private readonly prisma: PrismaService) { }

    async getEntitySchema(slug: string): Promise<EntityFormSchema> {
        const entity = await this.prisma.entityMetadata.findUnique({
            where: { slug },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!entity) {
            throw new NotFoundException(`Entity metadata '${slug}' not found`);
        }

        // Extract unique groups from fields
        const groupKeys = Array.from(new Set(entity.fields.map((f: any) => f.group).filter(Boolean))) as string[];
        const groups: SharedFieldGroup[] = groupKeys.map(key => ({
            key,
            label: key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            order: entity.fields.find((f: any) => f.group === key)?.order || 0,
            collapsible: true, // Defaulting to collapsible for a premium feel
        }));

        const fields: SharedFieldMetadata[] = entity.fields.map((f: any) => ({
            key: f.name,
            label: f.label,
            type: f.fieldType as SharedFieldMetadata['type'],
            placeholder: f.placeholder ?? undefined,
            defaultValue: f.defaultValue ?? undefined,
            helpText: f.helpText ?? undefined,
            validation: {
                required: f.required,
                min: f.min ? Number(f.min) : undefined,
                max: f.max ? Number(f.max) : undefined,
                minLength: f.minLength ?? undefined,
                maxLength: f.maxLength ?? undefined,
                pattern: f.pattern ?? undefined,
            },
            options: (f.options as unknown as SharedFieldMetadata['options']) ?? undefined,
            group: f.group ?? undefined,
            order: f.order,
            colSpan: (f.colSpan as SharedFieldMetadata['colSpan']) || 1,
            visible: f.visible,
            disabled: f.disabled,
        }));

        return {
            entitySlug: entity.slug,
            displayName: entity.displayName,
            description: entity.description ?? undefined,
            groups,
            fields,
            layout: { columns: 2, labelPosition: 'top' },
            version: entity.version,
        };
    }

    async listEntitySlugs(): Promise<{ slug: string; displayName: string }[]> {
        const schemas = await this.prisma.entityMetadata.findMany({
            where: { isActive: true },
            select: { slug: true, displayName: true },
            orderBy: { displayName: 'asc' },
        });

        return schemas.map((s: { slug: string; displayName: string }) => ({
            slug: s.slug,
            displayName: s.displayName,
        }));
    }
}
