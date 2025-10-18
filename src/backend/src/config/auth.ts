import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

// PrismaClient global para Better Auth (não troca schema por tenant)
const prisma = new PrismaClient();

const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-better-auth-key-for-production-fitos-2025",
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
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:3001"],
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

export default auth;
export type Session = typeof auth.$Infer.Session;