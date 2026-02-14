import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProcessDefinitionController } from './process-definition.controller';
import { ProcessDefinitionService } from './process-definition.service';
import { ProcessStepService } from './process-step.service';

@Module({
    imports: [PrismaModule],
    controllers: [ProcessDefinitionController],
    providers: [ProcessDefinitionService, ProcessStepService],
    exports: [ProcessDefinitionService, ProcessStepService],
})
export class ProcessDefinitionModule {}
