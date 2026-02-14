import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OutboundDeliveryService } from './outbound-delivery.service';
import { CreateOutboundDeliveryDto } from './dto/create-outbound-delivery.dto';

@Controller('outbound-deliveries')
export class OutboundDeliveryController {
    constructor(private readonly service: OutboundDeliveryService) { }

    @Post()
    create(@Body() dto: CreateOutboundDeliveryDto) {
        return this.service.create(dto);
    }

    @Post(':id/post-goods-issue')
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
