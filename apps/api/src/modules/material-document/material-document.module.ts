import { Module } from '@nestjs/common';
import { MaterialDocumentService } from './material-document.service';
import { MaterialDocumentController } from './material-document.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MaterialDocumentController],
    providers: [MaterialDocumentService],
    exports: [MaterialDocumentService],
})
export class MaterialDocumentModule { }
