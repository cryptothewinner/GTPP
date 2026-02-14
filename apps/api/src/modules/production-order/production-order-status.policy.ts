import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductionOrderStatus } from '@prisma/client';

@Injectable()
export class ProductionOrderStatusPolicy {
    private readonly allowedTransitions: Record<ProductionOrderStatus, ProductionOrderStatus[]> = {
        DRAFT: ['PLANNED'],
        PLANNED: ['IN_PROGRESS'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'], // CANCELLED = TECO equivalent
        COMPLETED: [],
        CANCELLED: [],
    };

    assertTransition(current: ProductionOrderStatus, next: ProductionOrderStatus) {
        if (current === next) return;

        const allowed = this.allowedTransitions[current] ?? [];
        if (!allowed.includes(next)) {
            throw new BadRequestException(
                `Geçersiz üretim emri statü geçişi: ${current} -> ${next}. ` +
                `İzin verilen geçişler: ${allowed.join(', ') || 'yok'}`,
            );
        }
    }
}

