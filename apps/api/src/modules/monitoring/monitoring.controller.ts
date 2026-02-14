import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Query,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ServiceLogService, ServiceLogQueryDto } from './service-log.service';

@Controller('monitoring')
export class MonitoringController {
    constructor(private readonly serviceLogService: ServiceLogService) {}

    /**
     * GET /api/v1/monitoring/logs
     * Servis loglarını filtreli listeler
     */
    @Get('logs')
    async getLogs(@Query() query: ServiceLogQueryDto) {
        return this.serviceLogService.findAll({
            ...query,
            page: query.page ? Number(query.page) : 1,
            pageSize: query.pageSize ? Number(query.pageSize) : 50,
            statusCodeMin: query.statusCodeMin
                ? Number(query.statusCodeMin)
                : undefined,
            statusCodeMax: query.statusCodeMax
                ? Number(query.statusCodeMax)
                : undefined,
        });
    }

    /**
     * GET /api/v1/monitoring/logs/:id
     * Tekil log detayı
     */
    @Get('logs/:id')
    async getLog(@Param('id') id: string) {
        const log = await this.serviceLogService.findOne(id);
        if (!log) {
            throw new HttpException('Log not found', HttpStatus.NOT_FOUND);
        }
        return log;
    }

    /**
     * GET /api/v1/monitoring/stats
     * Özet istatistikler (Dashboard kartları için)
     */
    @Get('stats')
    async getStats() {
        return this.serviceLogService.getStats();
    }

    /**
     * POST /api/v1/monitoring/retry/:logId
     * Başarısız isteği tekrar dene
     */
    @Post('retry/:logId')
    async retry(@Param('logId') logId: string) {
        try {
            return await this.serviceLogService.retry(logId);
        } catch (error) {
            throw new HttpException(
                (error as Error).message,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * PATCH /api/v1/monitoring/archive/:logId
     * Hatayı "Çözüldü" olarak işaretle
     */
    @Patch('archive/:logId')
    async archive(@Param('logId') logId: string) {
        try {
            return await this.serviceLogService.archive(logId);
        } catch (error) {
            throw new HttpException(
                (error as Error).message,
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
