export const TenantTypes = {
    INDIVIDUAL: 'individual',
    BUSINESS: 'business',
    SYSTEM: 'system',
} as const;

export type TenantType = keyof typeof TenantTypes;

export const VALID_TENANT_TYPES = Object.values(TenantTypes);
