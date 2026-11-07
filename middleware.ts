import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Middleware uses the edge-safe config only. Importing the full auth
// setup here pulled Prisma and bcrypt into the edge bundle and pushed
// it past Vercel's 1 MB edge function limit on the Hobby plan.
export const { auth: middleware } = NextAuth(authConfig);
export const config = { matcher: ["/app/:path*"] };
