import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { query, execute } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import { createHash } from "crypto";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  image: string;
  password_hash: string | null;
  is_creator: boolean;
  wallet_address: string;
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password + (process.env.NEXTAUTH_SECRET || "viajax-salt")).digest("hex");
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
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const email = credentials.email.trim().toLowerCase();
          const password = credentials.password;
          const role = credentials.role || "consumer";
          const isCreator = role === "creator";

          if (password.length < 6) return null;

          const hashedPassword = hashPassword(password);

          try {
            // Check if user exists
            const users = await query<UserRow[]>(
              "SELECT * FROM users WHERE email = ?",
              [email]
            );

            if (users.length > 0) {
              const user = users[0];
              // If user has a password, verify it
              if (user.password_hash && user.password_hash !== hashedPassword) {
                return null; // Wrong password
              }
              // If user exists but has no password, set it now
              if (!user.password_hash) {
                await execute(
                  "UPDATE users SET password_hash = ? WHERE id = ?",
                  [hashedPassword, user.id]
                ).catch(() => {});
              }
              // Update is_creator if user is signing in as creator
              if (isCreator && !user.is_creator) {
                await execute(
                  "UPDATE users SET is_creator = TRUE WHERE id = ?",
                  [user.id]
                ).catch(() => {});
              }
              return {
                id: user.id,
                email: user.email,
                name: user.name || email.split("@")[0],
                image: user.image || null,
                isCreator: isCreator || user.is_creator,
              };
            }

            // Create new user with password and role
            const id = crypto.randomUUID();
            const name = email.split("@")[0];
            await execute(
              "INSERT INTO users (id, email, name, password_hash, is_creator) VALUES (?, ?, ?, ?, ?)",
              [id, email, name, hashedPassword, isCreator]
            );

            return { id, email, name, isCreator };
          } catch (dbError) {
            console.error("[Auth] DB Error:", (dbError as Error).message);
            // Fallback: If DB is unreachable, create a temporary session
            const fallbackId = crypto.randomUUID();
            console.warn("[Auth] Using fallback session for:", email);
            return { id: fallbackId, email, name: email.split("@")[0], isCreator };
          }
        } catch (outerError) {
          console.error("[Auth] Critical error:", outerError);
          return null;
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
      try {
        // For Google OAuth, sync user to DB
        if (account?.provider === "google" && user.email) {
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
        }
      } catch (err) {
        console.error("[Auth] signIn callback error:", err);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.isCreator = (user as { isCreator?: boolean }).isCreator || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; isCreator?: boolean }).id = token.id as string;
        (session.user as { id?: string; isCreator?: boolean }).isCreator = token.isCreator as boolean;
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
