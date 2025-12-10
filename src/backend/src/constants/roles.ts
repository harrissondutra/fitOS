export const UserRoles = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    TRAINER: 'TRAINER',
    NUTRITIONIST: 'NUTRITIONIST',
    CLIENT: 'CLIENT', // Replaces MEMBER
    EMPLOYEE: 'EMPLOYEE',
} as const;

export type UserRole = keyof typeof UserRoles;

export const VALID_ROLES = Object.values(UserRoles);
