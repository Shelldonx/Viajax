import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { query, execute } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  image: string;
  is_creator: boolean;
  wallet_address: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth (recommended for production)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Email/password credentials (always available)
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@email.com" },
        name: { label: "Name", type: "text", placeholder: "Your name" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email.trim().toLowerCase();
        const name = credentials.name || email.split("@")[0];

        try {
          // Check if user exists
          const users = await query<UserRow[]>(
            "SELECT * FROM users WHERE email = ?",
            [email]
          );

          if (users.length > 0) {
            const user = users[0];
            return {
              id: user.id,
              email: user.email,
              name: user.name || name,
              image: user.image,
            };
          }

          // Create new user
          const id = crypto.randomUUID();
          await execute(
            "INSERT INTO users (id, email, name) VALUES (?, ?, ?)",
            [id, email, name]
          );

          return { id, email, name };
        } catch (dbError) {
          console.error("[Auth] DB Error:", (dbError as Error).message);
          // Fallback: If DB is unreachable, create a temporary session
          // This allows the app to work while DB connection is being set up
          const fallbackId = crypto.randomUUID();
          console.warn("[Auth] Using fallback session for:", email);
          return { id: fallbackId, email, name };
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, sync user to DB
      if (account?.provider === "google" && user.email) {
        try {
          const users = await query<UserRow[]>(
            "SELECT * FROM users WHERE email = ?",
            [user.email]
          );
          if (users.length === 0) {
            const id = crypto.randomUUID();
            await execute(
              "INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)",
              [id, user.email, user.name || "", user.image || ""]
            );
            user.id = id;
          } else {
            user.id = users[0].id;
          }
        } catch (dbError) {
          console.error("[Auth] Google sync DB error:", (dbError as Error).message);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
