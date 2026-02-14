import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ServiceDirection, ServiceStatus } from '@prisma/client';

export interface CreateServiceLogDto {
    direction: ServiceDirection;
    endpoint: string;
    method: string;
    statusCode: number;
    durationMs: number;
    requestHeaders?: Record<string, unknown>;
    requestBody?: unknown;
    responseHeaders?: Record<string, unknown>;
    responseBody?: unknown;
    errorMessage?: string;
    isRetriable?: boolean;
    clientIp?: string;
    userId?: string;
    traceId?: string;
}

export interface ServiceLogQueryDto {
    page?: number;
    pageSize?: number;
    direction?: ServiceDirection;
    status?: ServiceStatus;
    method?: string;
    search?: string;
    statusCodeMin?: number;
    statusCodeMax?: number;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ServiceLogService {
    private readonly logger = new Logger(ServiceLogService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Asenkron loglama - ana akışı bloklamaz.
     * setImmediate ile event loop'un bir sonraki turunda çalışır.
     */
    logAsync(dto: CreateServiceLogDto): void {
        setImmediate(async () => {
            try {
                await this.create(dto);
            } catch (error) {
                this.logger.error(
                    `Failed to log service request: ${(error as Error).message}`,
                );
            }
        });
    }

    async create(dto: CreateServiceLogDto) {
        const status =
            dto.statusCode >= 400 ? ServiceStatus.FAILED : ServiceStatus.SUCCESS;
        const isRetriable =
            dto.isRetriable ?? (dto.statusCode >= 500 && dto.method !== 'GET');

        return this.prisma.serviceLog.create({
            data: {
                direction: dto.direction,
                endpoint: dto.endpoint,
                method: dto.method,
                statusCode: dto.statusCode,
                durationMs: dto.durationMs,
                requestHeaders: dto.requestHeaders as Prisma.InputJsonValue,
                requestBody: dto.requestBody as Prisma.InputJsonValue,
                responseHeaders: dto.responseHeaders as Prisma.InputJsonValue,
                responseBody: dto.responseBody as Prisma.InputJsonValue,
                errorMessage: dto.errorMessage,
                isRetriable,
                status,
                clientIp: dto.clientIp,
                userId: dto.userId,
                traceId: dto.traceId,
            },
        });
    }

    async findAll(query: ServiceLogQueryDto) {
        const {
            page = 1,
            pageSize = 50,
            direction,
            status,
            method,
            search,
            statusCodeMin,
            statusCodeMax,
            startDate,
            endDate,
            sortField = 'createdAt',
            sortOrder = 'desc',
        } = query;

        const where: Prisma.ServiceLogWhereInput = {};

        if (direction) where.direction = direction;
        if (status) where.status = status;
        if (method) where.method = method;

        if (search) {
            where.OR = [
                { endpoint: { contains: search, mode: 'insensitive' } },
                { errorMessage: { contains: search, mode: 'insensitive' } },
                { traceId: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (statusCodeMin || statusCodeMax) {
            where.statusCode = {};
            if (statusCodeMin) where.statusCode.gte = statusCodeMin;
            if (statusCodeMax) where.statusCode.lte = statusCodeMax;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const allowedSortFields = [
            'createdAt',
            'durationMs',
            'statusCode',
            'endpoint',
            'method',
        ];
        const safeSortField = allowedSortFields.includes(sortField)
            ? sortField
            : 'createdAt';

        const [data, total] = await Promise.all([
            this.prisma.serviceLog.findMany({
                where,
                orderBy: { [safeSortField]: sortOrder },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.serviceLog.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async findOne(id: string) {
        return this.prisma.serviceLog.findUnique({ where: { id } });
    }

    async getStats() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
            totalToday,
            failedToday,
            totalLastHour,
            failedLastHour,
            avgDuration,
            pendingRetry,
        ] = await Promise.all([
            this.prisma.serviceLog.count({
                where: { createdAt: { gte: oneDayAgo } },
            }),
            this.prisma.serviceLog.count({
                where: {
                    createdAt: { gte: oneDayAgo },
                    status: ServiceStatus.FAILED,
                },
            }),
            this.prisma.serviceLog.count({
                where: { createdAt: { gte: oneHourAgo } },
            }),
            this.prisma.serviceLog.count({
                where: {
                    createdAt: { gte: oneHourAgo },
                    status: ServiceStatus.FAILED,
                },
            }),
            this.prisma.serviceLog.aggregate({
                where: { createdAt: { gte: oneDayAgo } },
                _avg: { durationMs: true },
            }),
            this.prisma.serviceLog.count({
                where: { status: ServiceStatus.PENDING_RETRY },
            }),
        ]);

        return {
            totalToday,
            failedToday,
            errorRateToday:
                totalToday > 0
                    ? Number(((failedToday / totalToday) * 100).toFixed(2))
                    : 0,
            totalLastHour,
            failedLastHour,
            avgDurationMs: Math.round(avgDuration._avg.durationMs ?? 0),
            pendingRetry,
        };
    }

    async retry(logId: string) {
        const log = await this.prisma.serviceLog.findUnique({
            where: { id: logId },
        });

        if (!log) {
            throw new Error('Service log not found');
        }

        if (!log.isRetriable) {
            throw new Error('This request is not retriable');
        }

        // İsteği simüle et
        const startTime = Date.now();
        try {
            const response = await fetch(log.endpoint, {
                method: log.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(log.requestHeaders as Record<string, string>),
                },
                body:
                    log.method !== 'GET' && log.requestBody
                        ? JSON.stringify(log.requestBody)
                        : undefined,
            });

            const durationMs = Date.now() - startTime;
            const responseBody = await response.json().catch(() => null);

            // Orijinal logu güncelle
            await this.prisma.serviceLog.update({
                where: { id: logId },
                data: {
                    status: ServiceStatus.RETRIED,
                    retryCount: { increment: 1 },
                },
            });

            // Yeni log oluştur
            const newLog = await this.create({
                direction: log.direction,
                endpoint: log.endpoint,
                method: log.method,
                statusCode: response.status,
                durationMs,
                requestHeaders: log.requestHeaders as Record<string, unknown>,
                requestBody: log.requestBody as unknown,
                responseBody: responseBody,
                errorMessage: response.ok
                    ? undefined
                    : `Retry failed: HTTP ${response.status}`,
                clientIp: log.clientIp ?? undefined,
                userId: log.userId ?? undefined,
                traceId: log.traceId ?? undefined,
            });

            return { success: response.ok, newLog };
        } catch (error) {
            const durationMs = Date.now() - startTime;

            await this.prisma.serviceLog.update({
                where: { id: logId },
                data: { retryCount: { increment: 1 } },
            });

            const newLog = await this.create({
                direction: log.direction,
                endpoint: log.endpoint,
                method: log.method,
                statusCode: 0,
                durationMs,
                requestHeaders: log.requestHeaders as Record<string, unknown>,
                requestBody: log.requestBody as unknown,
                errorMessage: `Retry error: ${(error as Error).message}`,
                clientIp: log.clientIp ?? undefined,
                userId: log.userId ?? undefined,
                traceId: log.traceId ?? undefined,
            });

            return { success: false, newLog };
        }
    }

    async archive(logId: string) {
        return this.prisma.serviceLog.update({
            where: { id: logId },
            data: { status: ServiceStatus.ARCHIVED },
        });
    }
}
