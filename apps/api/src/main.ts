import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // ── Global Prefix ──
    const prefix = config.get<string>('API_PREFIX', '/api/v1');
    app.setGlobalPrefix(prefix);

    // ── Global Pipes ──
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // ── Global Filters & Interceptors ──
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ApiResponseInterceptor());

    // ── CORS ──
    app.enableCors({
        origin: config.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
        credentials: true,
    });

    const port = config.get<number>('API_PORT', 4000);
    await app.listen(port);

    logger.log(`
  ╔══════════════════════════════════════════════════╗
  ║  🌿 SepeNatural 2026 API                        ║
  ║  Environment: ${config.get('NODE_ENV', 'development').padEnd(33)}║
  ║  Port: ${String(port).padEnd(41)}║
  ║  Prefix: ${prefix.padEnd(38)}║
  ╚══════════════════════════════════════════════════╝
  `);
}

bootstrap();
