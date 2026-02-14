export type ProductionOrderDomainEvent =
    | { type: 'production-order.start.requested'; orderId: string }
    | { type: 'production-order.operation.confirmed'; orderId: string; operationId: string; dto: any }
    | { type: 'production-order.complete.requested'; orderId: string };

