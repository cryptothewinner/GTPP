
import { PrismaClient, BPCategory, BPRole, AddressType, ActivityType, ActivityStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCustomers() {
    console.log('--- Seeding Sample Customers ---');

    const randomDate = (start: Date, end: Date) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    const customers = [
        {
            bpNumber: 'C-2026-001',
            name1: 'Vitamin Dunyasi Kimya A.S.',
            taxOffice: 'Maslak',
            taxNumber: '1234567890',
            industry: 'Ilac & Kimya',
            details: {
                salesDistrict: 'Marmara',
                priceList: 'Toptan',
                paymentTerm: 'Net 30',
                creditLimit: 500000,
                riskClass: 'A'
            },
            addresses: [
                {
                    type: AddressType.HEADQUARTER,
                    city: 'Istanbul',
                    district: 'Sisli',
                    addressLine1: 'Buyukdere Cad. No:123',
                    phone: '+90 212 555 1010',
                    email: 'info@vitamindunyasi.com',
                    isDefault: true
                },
                {
                    type: AddressType.DELIVERY,
                    city: 'Kocaeli',
                    district: 'Gebze',
                    addressLine1: 'GOSB 1. Cadde No:5',
                    phone: '+90 262 555 2020',
                    isDefault: false
                }
            ],
            contacts: [
                { firstName: 'Ahmet', lastName: 'Yilmaz', title: 'Satin Alma Muduru', email: 'ahmet.y@vitamindunyasi.com', mobile: '+90 532 555 1111', isDefault: true },
                { firstName: 'Ayse', lastName: 'Demir', title: 'Muhasebe Sefi', email: 'ayse.d@vitamindunyasi.com', mobile: '+90 533 555 2222', isDefault: false }
            ],
            activities: [
                { type: ActivityType.CALL, subject: 'Fiyat Teklifi Hk.', description: 'Yeni sezon urunleri icin fiyat listesi istendi.', status: ActivityStatus.COMPLETED, performedAt: randomDate(new Date(2025, 0, 1), new Date()) },
                { type: ActivityType.MEETING, subject: 'Sozlesme Yenileme', description: 'Yillik tedarik sozlesmesi gorusuldu.', status: ActivityStatus.COMPLETED, performedAt: randomDate(new Date(2025, 0, 1), new Date()) },
                { type: ActivityType.TASK, subject: 'Numune Gonderimi', description: 'Vitamin C numuneleri kargolanacak.', status: ActivityStatus.PLANNED, dueDate: new Date(Date.now() + 86400000) }
            ]
        },
        {
            bpNumber: 'C-2026-002',
            name1: 'Dogal Yasam Urunleri Ltd. Sti.',
            taxOffice: 'Karsiyaka',
            taxNumber: '9876543210',
            industry: 'Perakende',
            details: {
                salesDistrict: 'Ege',
                priceList: 'Bayi',
                paymentTerm: 'Net 60',
                creditLimit: 150000,
                riskClass: 'B'
            },
            addresses: [
                {
                    type: AddressType.HEADQUARTER,
                    city: 'Izmir',
                    district: 'Karsiyaka',
                    addressLine1: 'Anadolu Cad. No:45',
                    phone: '+90 232 444 3030',
                    email: 'bilgi@dogalyasam.com',
                    isDefault: true
                }
            ],
            contacts: [
                { firstName: 'Mehmet', lastName: 'Kaya', title: 'Genel Mudur', email: 'mehmet@dogalyasam.com', mobile: '+90 542 444 3333', isDefault: true }
            ],
            activities: [
                { type: ActivityType.EMAIL, subject: 'Kampanya Duyurusu', description: 'Subat ayi kampanyalari iletildi.', status: ActivityStatus.COMPLETED, performedAt: randomDate(new Date(2025, 0, 1), new Date()) }
            ]
        },
        {
            bpNumber: 'C-2026-003',
            name1: 'Anadolu Eczane Deposu A.S.',
            taxOffice: 'Cankaya',
            taxNumber: '5554443332',
            industry: 'Saglik',
            details: {
                salesDistrict: 'Ic Anadolu',
                priceList: 'Ozel',
                paymentTerm: 'Net 90',
                creditLimit: 1000000,
                riskClass: 'A'
            },
            addresses: [
                {
                    type: AddressType.HEADQUARTER,
                    city: 'Ankara',
                    district: 'Cankaya',
                    addressLine1: 'Ataturk Bulvari No:100',
                    phone: '+90 312 333 4040',
                    email: 'iletisim@anadolueczane.com',
                    isDefault: true
                },
                {
                    type: AddressType.DELIVERY,
                    city: 'Konya',
                    district: 'Selcuklu',
                    addressLine1: 'Lojistik Merkezi No:1',
                    phone: '+90 332 222 5050',
                    isDefault: false
                }
            ],
            contacts: [
                { firstName: 'Zeynep', lastName: 'Ozturk', title: 'Satin Alma Uzmani', email: 'zeynep.o@anadolueczane.com', mobile: '+90 555 333 4444', isDefault: true }
            ],
            activities: [
                { type: ActivityType.CALL, subject: 'Odeme Plani', description: 'Gecikmis bakiye icin gorusuldu.', status: ActivityStatus.COMPLETED, performedAt: randomDate(new Date(2025, 0, 1), new Date()) },
                { type: ActivityType.NOTE, subject: 'Risk Notu', description: 'Kredi limiti artirimi talep ediliyor.', status: ActivityStatus.COMPLETED, performedAt: new Date() }
            ]
        }
    ];

    for (const data of customers) {
        console.log(`Creating customer: ${data.name1}...`);

        await prisma.businessPartner.upsert({
            where: { bpNumber: data.bpNumber },
            update: {},
            create: {
                bpNumber: data.bpNumber,
                name1: data.name1,
                category: BPCategory.ORGANIZATION,
                taxOffice: data.taxOffice,
                taxNumber: data.taxNumber,
                industry: data.industry,
                roles: [BPRole.CUSTOMER],
                isActive: true,

                customerDetails: {
                    create: data.details
                },

                addresses: {
                    create: data.addresses.map(a => ({
                        type: a.type,
                        city: a.city,
                        district: a.district,
                        addressLine1: a.addressLine1,
                        phone: a.phone,
                        email: a.email,
                        isDefault: a.isDefault,
                        country: 'TR'
                    }))
                },

                contacts: {
                    create: data.contacts.map(c => ({
                        firstName: c.firstName,
                        lastName: c.lastName,
                        title: c.title,
                        email: c.email,
                        mobile: c.mobile,
                        isDefault: c.isDefault
                    }))
                },

                activities: {
                    create: data.activities.map(act => ({
                        type: act.type,
                        subject: act.subject,
                        description: act.description,
                        status: act.status,
                        performedAt: act.performedAt,
                        dueDate: act.dueDate,
                        createdBy: 'SEED_SCRIPT'
                    }))
                }
            }
        });
    }

    console.log('✅ 3 Sample Customers seeded successfully!');
}

seedCustomers()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
