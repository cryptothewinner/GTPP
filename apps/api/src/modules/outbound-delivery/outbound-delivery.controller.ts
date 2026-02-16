import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OutboundDeliveryService } from './outbound-delivery.service';
import { CreateOutboundDeliveryDto } from './dto/create-outbound-delivery.dto';
import { Roles } from '../../common/guards/roles.guard';

@Controller('outbound-deliveries')
@Roles('viewer')
export class OutboundDeliveryController {
    constructor(private readonly service: OutboundDeliveryService) { }

    @Post()
    @Roles('operator')
    create(@Body() dto: CreateOutboundDeliveryDto) {
        return this.service.create(dto);
    }

    @Post(':id/post-goods-issue')
    @Roles('operator')
    postGoodsIssue(@Param('id') id: string) {
        return this.service.postGoodsIssue(id);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }
}
