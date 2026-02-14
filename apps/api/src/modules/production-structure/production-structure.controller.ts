import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { WorkStationService } from './work-station.service';
import { ProductionPlanService } from './production-plan.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateProductionSiteDto } from './dto/create-production-site.dto';
import { CreateWorkStationDto } from './dto/create-work-station.dto';
import { CreateProductionPlanDto } from './dto/create-production-plan.dto';
import { WorkStationStatus, ProductionPlanStatus } from '@prisma/client';

@Controller('production-structure')
export class ProductionStructureController {
    constructor(
        private readonly organizationService: OrganizationService,
        private readonly workStationService: WorkStationService,
        private readonly productionPlanService: ProductionPlanService,
    ) { }

    // Organization
    @Post('organizations')
    createOrg(@Body() dto: CreateOrganizationDto) {
        return this.organizationService.createOrganization(dto);
    }

    @Get('organizations')
    findAllOrgs() {
        return this.organizationService.findAllOrganizations();
    }

    // Sites
    @Post('sites')
    createSite(@Body() dto: CreateProductionSiteDto) {
        return this.organizationService.createSite(dto);
    }

    @Get('sites')
    findAllSites(@Query('organizationId') orgId?: string) {
        return this.organizationService.findAllSites(orgId);
    }

    // Work Stations
    @Post('work-stations')
    createStation(@Body() dto: CreateWorkStationDto) {
        return this.workStationService.create(dto);
    }

    @Get('work-stations')
    findAllStations(@Query('siteId') siteId?: string) {
        return this.workStationService.findAll(siteId);
    }

    @Get('work-stations/:id')
    findOneStation(@Param('id') id: string) {
        return this.workStationService.findOne(id);
    }

    @Patch('work-stations/:id/status')
    updateStationStatus(@Param('id') id: string, @Body('status') status: WorkStationStatus) {
        return this.workStationService.updateStatus(id, status);
    }

    // Production Plans
    @Post('plans')
    createPlan(@Body() dto: CreateProductionPlanDto) {
        return this.productionPlanService.create(dto);
    }

    @Get('plans')
    findAllPlans() {
        return this.productionPlanService.findAll();
    }

    @Get('plans/:id')
    findOnePlan(@Param('id') id: string) {
        return this.productionPlanService.findOne(id);
    }

    @Patch('plans/:id/status')
    updatePlanStatus(@Param('id') id: string, @Body('status') status: ProductionPlanStatus) {
        return this.productionPlanService.updateStatus(id, status);
    }
}
