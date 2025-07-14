import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/pg";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Define a minimal custom type for the token
// (You can expand this as needed for your app)
type CustomToken = {
  userId?: string;
  email?: string;
  restaurantId?: string | null;
  onboarded?: boolean;
  [key: string]: unknown;
};

type CustomSession = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    restaurantId?: string | null;
    onboarded?: boolean;
  };
  expires: string;
  [key: string]: unknown;
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined): Promise<{ id: string; email: string; restaurantId: string | null; onboarded: boolean } | null> {
        const result = LoginSchema.safeParse(credentials);
        if (!result.success) return null;
        const { email, password } = result.data;
        // Fetch user and restaurant by email, including restaurant name
        const { rows } = await pool.query('SELECT u.id, u.email, u."passwordHash", r.id as "restaurantId", r.name as "restaurantName" FROM "User" u LEFT JOIN "Restaurant" r ON u.id = r."userId" WHERE u.email = $1', [email]);
        if (rows.length === 0) return null;
        const user = rows[0];
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          restaurantId: user.restaurantId || null,
          onboarded: !!user.restaurantName,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    jwt(params: unknown) {
      const { token, user } = params as { token: CustomToken; user?: { id: string; email: string; restaurantId?: string | null; onboarded?: boolean } };
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.restaurantId = user.restaurantId ?? null;
        token.onboarded = user.onboarded ?? false;
      }
      return token;
    },
    async session(params: unknown) {
      const { session, token, newSession, trigger } = params as {
        session: CustomSession;
        token: CustomToken;
        newSession?: unknown;
        trigger?: string;
      };
      // Handle session update (trigger === 'update')
      if (trigger === 'update' && newSession) {
        Object.assign(session, newSession);
      }
      if (token) {
        session.user = {
          id: token.userId,
          email: token.email ?? null,
          name: null, // or token.name if available
          image: null, // or token.image if available
          restaurantId: token.restaurantId ?? null,
          onboarded: token.onboarded ?? false,
        };
      }
      // Always return a valid Session object with expires
      return { ...session, expires: session.expires };
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 