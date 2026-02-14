import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { BusinessPartnerService } from './business-partner.service';
import { CreateBusinessPartnerDto } from './dto/create-business-partner.dto';
import { BPRole } from '@prisma/client';

@Controller('business-partners')
export class BusinessPartnerController {
    constructor(private readonly businessPartnerService: BusinessPartnerService) { }

    @Get()
    findAll(
        @Query('page') page?: number,
        @Query('pageSize') pageSize?: number,
        @Query('role') role?: BPRole,
        @Query('search') search?: string,
    ) {
        return this.businessPartnerService.findAll({
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 10,
            role,
            search,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.businessPartnerService.findOne(id);
    }

    @Post()
    create(@Body() createBusinessPartnerDto: CreateBusinessPartnerDto) {
        return this.businessPartnerService.create(createBusinessPartnerDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBusinessPartnerDto: Partial<CreateBusinessPartnerDto>) {
        return this.businessPartnerService.update(id, updateBusinessPartnerDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.businessPartnerService.remove(id);
    }

    // ─── CRM Endpoints ─────────────────────────────────────────────

    @Post(':id/activities')
    addActivity(
        @Param('id') id: string,
        @Body() createActivityDto: import('./dto/create-activity.dto').CreateActivityDto,
    ) {
        // TODO: Extract userId from Request/AuthGuard
        return this.businessPartnerService.addActivity(id, createActivityDto, 'SYS_USER');
    }

    @Get(':id/activities')
    getActivities(@Param('id') id: string) {
        return this.businessPartnerService.getActivities(id);
    }

    @Get(':id/metrics')
    getMetrics(@Param('id') id: string) {
        return this.businessPartnerService.getMetrics(id);
    }

    @Post(':id/notes')
    addNote(
        @Param('id') id: string,
        @Body() createNoteDto: import('./dto/create-note.dto').CreateNoteDto,
    ) {
        // TODO: Extract userId from Request/AuthGuard
        return this.businessPartnerService.addNote(id, createNoteDto, 'SYS_USER');
    }
}
