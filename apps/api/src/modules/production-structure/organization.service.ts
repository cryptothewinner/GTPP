import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateProductionSiteDto } from './dto/create-production-site.dto';

@Injectable()
export class OrganizationService {
    constructor(private readonly prisma: PrismaService) { }

    async createOrganization(dto: CreateOrganizationDto) {
        return this.prisma.organization.create({ data: dto });
    }

    async findAllOrganizations() {
        return this.prisma.organization.findMany({
            include: { sites: true },
        });
    }

    async createSite(dto: CreateProductionSiteDto) {
        return this.prisma.productionSite.create({ data: dto });
    }

    async findAllSites(organizationId?: string) {
        return this.prisma.productionSite.findMany({
            where: organizationId ? { organizationId } : {},
            include: { workStations: true },
        });
    }

    async findOneSite(id: string) {
        const site = await this.prisma.productionSite.findUnique({
            where: { id },
            include: { workStations: true },
        });
        if (!site) throw new NotFoundException(`Site not found: ${id}`);
        return site;
    }
}
