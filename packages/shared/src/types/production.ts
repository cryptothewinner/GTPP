// Production Management Types

export type ProductionOrderStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BatchStatus = 'PENDING' | 'IN_PRODUCTION' | 'QC_PENDING' | 'QC_PASSED' | 'QC_FAILED' | 'RELEASED' | 'REJECTED';
export type MaterialType = 'RAW_MATERIAL' | 'PACKAGING' | 'SEMI_FINISHED' | 'FINISHED_PRODUCT';

export type MaterialBatchStatus = 'AVAILABLE' | 'RESERVED' | 'QUARANTINE' | 'EXPIRED' | 'CONSUMED';

export interface SupplierDto {
    id: string;
    code: string;
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    taxNumber?: string | null;
    isActive: boolean;
    leadTimeDays?: number | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MaterialDto {
    id: string;
    code: string;
    name: string;
    type: MaterialType;
    unitOfMeasure: string;
    unitPrice: number;
    currency: string;
    currentStock: number;
    minStockLevel: number;
    moq?: number | null;
    supplierId?: string | null;
    supplier?: SupplierDto | null;
    category?: string | null;
    casNumber?: string | null;
    shelfLife?: number | null;
    storageCondition?: string | null;
    isActive: boolean;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MaterialBatchDto {
    id: string;
    batchNumber: string;
    materialId: string;
    material?: MaterialDto;
    supplierLotNo?: string | null;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
    quantity: number;
    remainingQuantity: number;
    status: MaterialBatchStatus;
    storageLocation?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProductDto {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    category?: string | null;
    unitOfMeasure: string;
    salePrice: number;
    costPrice: number;
    currency: string;
    currentStock: number;
    batchSize: number;
    profitMargin?: number | null;
    barcode?: string | null;
    isActive: boolean;
    imageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface RecipeItemDto {
    id: string;
    recipeId: string;
    materialId: string;
    material?: MaterialDto;
    quantity: number;
    unit: string;
    wastagePercent: number;
    unitCost: number;
    totalCost: number;
    notes?: string | null;
    order: number;
}

export interface RecipeDto {
    id: string;
    code: string;
    name: string;
    productId: string;
    product?: ProductDto;
    version: number;
    batchSize: number;
    batchUnit: string;
    totalCost: number;
    currency: string;
    instructions?: string | null;
    isActive: boolean;
    approvedBy?: string | null;
    approvedAt?: string | null;
    items?: RecipeItemDto[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductionOrderDto {
    id: string;
    orderNumber: string;
    productId: string;
    product?: ProductDto;
    recipeId: string;
    recipe?: RecipeDto;
    plannedQuantity: number;
    actualQuantity?: number | null;
    unit: string;
    status: ProductionOrderStatus;
    priority: number;
    plannedStart?: string | null;
    plannedEnd?: string | null;
    actualStart?: string | null;
    actualEnd?: string | null;
    assignedTo?: string | null;
    notes?: string | null;
    batches?: ProductionBatchDto[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductionBatchDto {
    id: string;
    batchNumber: string;
    productionOrderId: string;
    productionOrder?: ProductionOrderDto;
    quantity: number;
    unit: string;
    status: BatchStatus;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
    qcDate?: string | null;
    qcNotes?: string | null;
    qcApprovedBy?: string | null;
    storageLocation?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}
