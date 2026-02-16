import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import type { ServerSideGridRequest, ServerSideGridResponse, StockItemDto } from '@sepenatural/shared';
import { Public } from '../../auth/jwt-auth.guard';
import { Roles } from '../../common/guards/roles.guard';

@Controller('inventory')
@Roles('viewer')
export class InventoryController {
    constructor(private inventoryService: InventoryService) { }

    /**
     * AG Grid Server-Side Row Model endpoint.
     * Receives POST with grid request, returns paginated data.
     */
    @Post('grid')
    @UseGuards(AuthGuard('jwt'))
    async getGridData(
        @Body() gridRequest: ServerSideGridRequest,
    ): Promise<ServerSideGridResponse<StockItemDto>> {
        return this.inventoryService.getStocksForGrid(gridRequest);
    }

    /**
     * Single stock item by SKU.
     */
    @Get(':sku')
    @UseGuards(AuthGuard('jwt'))
    async getStockBySku(@Param('sku') sku: string): Promise<StockItemDto> {
        return this.inventoryService.getStockBySku(sku);
    }

    /**
     * Health check for the integration bridge.
     */
    @Public()
    @Get('bridge/health')
    async bridgeHealth() {
        return this.inventoryService.checkBridgeHealth();
    }
}
