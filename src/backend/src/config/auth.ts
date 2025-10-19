import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

// PrismaClient global para Better Auth (não troca schema por tenant)
const prisma = new PrismaClient();

// Validar variáveis de ambiente obrigatórias
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET é obrigatória para o Better Auth');
}

if (!process.env.BETTER_AUTH_BASE_URL && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('BETTER_AUTH_BASE_URL ou NEXT_PUBLIC_API_URL é obrigatória para o Better Auth');
}

// TRUSTED_ORIGINS é obrigatória apenas em produção
if (process.env.NODE_ENV === 'production' && !process.env.TRUSTED_ORIGINS) {
  throw new Error('TRUSTED_ORIGINS é obrigatória para o Better Auth em produção');
}

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      // Usar bcrypt para compatibilidade com dados existentes
      hash: async (password: string) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async (data: { password: string; hash: string }) => {
        return await bcrypt.compare(data.password, data.hash);
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || [
    "http://localhost:3000",
    "http://localhost:3001"
  ],
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_URL,
  // Configuração adicional para garantir que as rotas funcionem
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});

export default auth;
export type Session = typeof auth.$Infer.Session;