import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/guards/roles.guard';

@Controller('dashboard')
@Roles('viewer')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    async getOverview() {
        return { data: await this.dashboardService.getOverview() };
    }

    @Get('kpis')
    async getKpis() {
        return { data: await this.dashboardService.getKpis() };
    }

    @Get('production-status')
    async getProductionStatus() {
        return { data: await this.dashboardService.getProductionStatus() };
    }

    @Get('recent-activity')
    async getRecentActivity() {
        return { data: await this.dashboardService.getRecentActivity() };
    }
}
