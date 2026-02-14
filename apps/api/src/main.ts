import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { PerformanceMetricsService } from './modules/performance/performance-metrics.service';
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
        : [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
        ];

    app.enableCors({
        origin: allowedOrigins,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    app.setGlobalPrefix('api/v1');

    const perf = app.get(PerformanceMetricsService);
    const prisma = app.get(PrismaService);

    app.use((req: Request, res: Response, next: NextFunction) => {
        const start = performance.now();
        res.on('finish', () => {
            const durationMs = performance.now() - start;
            perf.recordRequest({
                method: req.method,
                route: req.originalUrl || req.url,
                statusCode: res.statusCode,
                durationMs,
                timestamp: Date.now(),
            });
        });
        next();
    });

    prisma.$on('query', (event: Prisma.QueryEvent) => {
        const [model = 'raw', action = 'raw'] = event.target.split('.');
        perf.recordPrisma({
            model,
            action,
            durationMs: event.duration,
            timestamp: Date.now(),
        });
    });

    const port = process.env.API_PORT || 3001;
    await app.listen(port);
    console.log(`🚀 API running on http://localhost:${port}`);
}
bootstrap();

