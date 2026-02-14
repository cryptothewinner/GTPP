import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessPartnerDto } from './dto/create-business-partner.dto';
import { BPRole, Prisma } from '@prisma/client';

@Injectable()
export class BusinessPartnerService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: {
        page?: number;
        pageSize?: number;
        role?: BPRole;
        search?: string;
    }) {
        const { page = 1, pageSize = 10, role, search } = params;
        const skip = (page - 1) * pageSize;

        const where: Prisma.BusinessPartnerWhereInput = {};

        if (role) {
            where.roles = { has: role };
        }

        if (search) {
            where.OR = [
                { bpNumber: { contains: search, mode: 'insensitive' } },
                { name1: { contains: search, mode: 'insensitive' } },
                { name2: { contains: search, mode: 'insensitive' } },
                { searchTerm1: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.businessPartner.findMany({
                where,
                include: {
                    addresses: true,
                    contacts: true,
                    supplierDetails: true,
                    customerDetails: true,
                },
                skip,
                take: pageSize,
                orderBy: { bpNumber: 'asc' },
            }),
            this.prisma.businessPartner.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    async findOne(id: string) {
        const bp = await this.prisma.businessPartner.findUnique({
            where: { id },
            include: {
                addresses: true,
                contacts: true,
                supplierDetails: true,
                customerDetails: true,
                partnerFunctions: {
                    include: {
                        targetBP: { select: { id: true, bpNumber: true, name1: true } }
                    }
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                }
            },
        });

        if (!bp) {
            throw new NotFoundException(`Business Partner with ID ${id} not found`);
        }

        return bp;
    }

    async create(dto: CreateBusinessPartnerDto) {
        const { addresses, supplierDetails, ...bpData } = dto;

        // Check if BP Number exists
        const exists = await this.prisma.businessPartner.findUnique({
            where: { bpNumber: bpData.bpNumber },
        });

        if (exists) {
            throw new BadRequestException(`Business Partner with number ${bpData.bpNumber} already exists`);
        }

        return this.prisma.businessPartner.create({
            data: {
                ...bpData,
                addresses: addresses
                    ? {
                        create: addresses.map((addr) => ({
                            ...addr,
                        })),
                    }
                    : undefined,
                supplierDetails: supplierDetails
                    ? {
                        create: supplierDetails,
                    }
                    : undefined,
            },
            include: {
                addresses: true,
                supplierDetails: true,
            },
        });
    }

    async update(id: string, dto: Partial<CreateBusinessPartnerDto>) {
        const { addresses, supplierDetails, ...bpData } = dto;

        await this.findOne(id);

        return this.prisma.businessPartner.update({
            where: { id },
            data: {
                ...bpData,
                // Simple update logic: create new addresses if provided (complex nested update omitted for brevity)
                // In a real app, you'd handle upsert/delete for nested relations properly.
                supplierDetails: supplierDetails
                    ? {
                        upsert: {
                            create: supplierDetails,
                            update: supplierDetails,
                        },
                    }
                    : undefined,
            },
            include: {
                addresses: true,
                supplierDetails: true,
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.businessPartner.delete({ where: { id } });
    }

    // ─── CRM Extensions ───────────────────────────────────────────

    async addActivity(partnerId: string, dto: import('./dto/create-activity.dto').CreateActivityDto, userId: string) {
        await this.findOne(partnerId); // Validate existence

        return this.prisma.customerActivity.create({
            data: {
                ...dto,
                customerId: partnerId,
                createdBy: userId,
                // If status is COMPLETED and no performedAt, set to now
                performedAt: dto.status === 'COMPLETED' && !dto.performedAt ? new Date() : dto.performedAt,
            },
        });
    }

    async getActivities(partnerId: string) {
        return this.prisma.customerActivity.findMany({
            where: { customerId: partnerId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getMetrics(partnerId: string) {
        // Simple aggregation example
        const [totalOrders, totalRevenue] = await Promise.all([
            this.prisma.salesOrder.count({ where: { customerId: partnerId } }),
            this.prisma.salesOrder.aggregate({
                where: { customerId: partnerId },
                _sum: { totalNetAmount: true }
            })
        ]);

        // Let's check schema for exact field names
        // SalesOrder: totalNetAmount

        return {
            totalOrders,
            totalRevenue: totalRevenue._sum.totalNetAmount || 0,
        };
    }
    async addNote(partnerId: string, dto: import('./dto/create-note.dto').CreateNoteDto, userId: string) {
        await this.findOne(partnerId); // Validate existence

        return this.prisma.customerNote.create({
            data: {
                bpId: partnerId,
                content: dto.content,
                isPinned: dto.isPinned || false,
                createdBy: userId,
            },
        });
    }
}
