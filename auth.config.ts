import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config: no database, no bcrypt. Middleware runs on the
// edge runtime under a strict bundle size limit, so it only ever sees
// this lightweight config. The full config in lib/auth.ts layers the
// credentials provider and database access on top of it.
export const authConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname.startsWith("/app")) return isLoggedIn;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
