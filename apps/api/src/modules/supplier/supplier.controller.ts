import { Controller, Get } from '@nestjs/common';
import { SupplierService } from './supplier.service';

@Controller('suppliers')
export class SupplierController {
    constructor(private readonly supplierService: SupplierService) { }

    @Get('summary')
    async getSummary() {
        return this.supplierService.getSummary();
    }
}
