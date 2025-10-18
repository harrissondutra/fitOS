import { createAuthClient } from "better-auth/client";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
console.log('🔧 AuthClient configurado com baseURL:', baseURL);

export const authClient = createAuthClient({
  baseURL,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;