import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { MetadataValidatorService } from './metadata-validator.service';

@Module({
    controllers: [MetadataController],
    providers: [MetadataService, MetadataValidatorService],
    exports: [MetadataService, MetadataValidatorService],
})
export class MetadataModule { }
