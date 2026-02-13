
import { Module } from '@nestjs/common';
import { MaterialBatchController } from './material-batch.controller';
import { MaterialBatchService } from './material-batch.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MaterialBatchController],
    providers: [MaterialBatchService],
    exports: [MaterialBatchService],
})
export class MaterialBatchModule { }
