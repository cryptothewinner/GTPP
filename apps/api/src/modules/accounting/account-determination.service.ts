import { BadRequestException, Injectable } from '@nestjs/common';
import { MaterialType, MovementType, Prisma } from '@prisma/client';

type PrismaTx = Prisma.TransactionClient;

export type AccountDeterminationInput = {
    movementType: MovementType;
    valuationClass?: string | null;
    materialType: MaterialType;
    companyCode: string;
};

export type DeterminedAccounts = {
    inventoryGlAccountId: string;
    offsetGlAccountId: string;
    inventoryGlAccountNumber: string;
    offsetGlAccountNumber: string;
    mappingKey: string;
};

@Injectable()
export class AccountDeterminationService {
    private readonly systemId = 'ACCOUNTING';
    private readonly entityType = 'MATERIAL_MOVEMENT_ACCOUNT';

    async resolveAccounts(tx: PrismaTx, input: AccountDeterminationInput): Promise<DeterminedAccounts> {
        const valuationClass = input.valuationClass?.trim() || '*';
        const materialType = input.materialType;
        const companyCode = input.companyCode;
        const candidates = [
            this.buildKey(input.movementType, valuationClass, materialType, companyCode),
            this.buildKey(input.movementType, '*', materialType, companyCode),
            this.buildKey(input.movementType, valuationClass, '*', companyCode),
            this.buildKey(input.movementType, '*', '*', companyCode),
        ];

        const mapping = await tx.integrationMapping.findFirst({
            where: {
                systemId: this.systemId,
                entityType: this.entityType,
                localId: { in: candidates },
            },
        });

        if (!mapping) {
            throw new BadRequestException(`Account determination mapping not found for keys: ${candidates.join(', ')}`);
        }

        const payload = (mapping.payload ?? {}) as Record<string, unknown>;
        const inventoryGlAccountNumber = this.readPayloadString(payload, 'inventoryGlAccount');
        const offsetGlAccountNumber = this.readPayloadString(payload, 'offsetGlAccount');

        const [inventoryGlAccount, offsetGlAccount] = await Promise.all([
            tx.gLAccount.findUnique({ where: { accountNumber: inventoryGlAccountNumber } }),
            tx.gLAccount.findUnique({ where: { accountNumber: offsetGlAccountNumber } }),
        ]);

        if (!inventoryGlAccount) {
            throw new BadRequestException(`Configured inventory GL account does not exist: ${inventoryGlAccountNumber}`);
        }
        if (!offsetGlAccount) {
            throw new BadRequestException(`Configured offset GL account does not exist: ${offsetGlAccountNumber}`);
        }

        return {
            inventoryGlAccountId: inventoryGlAccount.id,
            offsetGlAccountId: offsetGlAccount.id,
            inventoryGlAccountNumber,
            offsetGlAccountNumber,
            mappingKey: mapping.localId,
        };
    }

    buildKey(movementType: MovementType, valuationClass: string, materialType: MaterialType | '*', companyCode: string): string {
        return [movementType, valuationClass || '*', materialType || '*', companyCode].join('|');
    }

    private readPayloadString(payload: Record<string, unknown>, key: string): string {
        const raw = payload[key];
        if (typeof raw !== 'string' || !raw.trim()) {
            throw new BadRequestException(`Account determination payload is missing '${key}'.`);
        }
        return raw.trim();
    }
}

