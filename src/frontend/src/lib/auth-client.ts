import { createAuthClient } from "better-auth/client";

const baseURL = process.env.NEXT_PUBLIC_API_URL;
console.log('🔧 AuthClient configurado com baseURL:', baseURL);

export const authClient: any = createAuthClient({
  baseURL,
  fetchOptions: {
    onError: (ctx: any) => {
      console.error('❌ AuthClient fetch error:', ctx.error);
    },
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
}: any = authClient;