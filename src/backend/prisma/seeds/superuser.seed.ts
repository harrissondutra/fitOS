import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function main() {
    console.log('👑 Seeding superuser and dedicated tenant...');

    // Check if superuser already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: 'harrissondutra@gmail.com' },
    });
    if (existingUser) {
        console.log('✅ Superuser already exists, skipping creation');
        return;
    }

    // Create dedicated tenant for superuser
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Superuser Tenant',
            subdomain: 'superuser',
            // Using default values for optional fields
            plan: 'enterprise',
            tenantType: 'business',
            status: 'active',
            billingEmail: 'harrissondutra@gmail.com',
            settings: {
                timezone: 'America/Sao_Paulo',
                currency: 'BRR',
                language: 'pt-BR',
                features: {
                    aiEnabled: true,
                    analyticsEnabled: true,
                    notificationsEnabled: true,
                },
            },
        },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@1234', 10);

    // Create superuser linked to the tenant
    await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'harrissondutra@gmail.com',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            name: 'Superuser',
            firstName: 'Super',
            lastName: 'User',
            // No restrictions, all default permissions apply
        },
    });

    console.log('✅ Superuser and tenant created successfully');
}
