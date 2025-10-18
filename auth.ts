import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Pool global para Better Auth (não troca schema por tenant)
const authPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const auth = betterAuth({
  database: authPool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
  baseURL: "http://localhost:3001",
});

export default auth;
