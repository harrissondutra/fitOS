import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Pool global para Better Auth (não troca schema por tenant)
const authPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const auth = betterAuth({
  database: authPool,
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-better-auth-key-for-production-fitos-2025",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:3001"],
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});

export default auth;
