import { Injectable } from '@nestjs/common';

@Injectable()
export class MetadataValidatorService {
    // TODO: Implement Ajv validation based on new schema if needed
    validate(slug: string, data: any) {
        return true;
    }
}
