import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@email.com" },
        name: { label: "Name", type: "text", placeholder: "Your name" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        try {
          // Verificar se utilizador existe
          const users = await query<UserRow[]>(
            "SELECT * FROM users WHERE email = ?",
            [credentials.email]
          );

          if (users.length > 0) {
            const user = users[0];
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            };
          }

          // Criar novo utilizador
          const id = crypto.randomUUID();
          await execute(
            "INSERT INTO users (id, email, name) VALUES (?, ?, ?)",
            [id, credentials.email, credentials.name || credentials.email.split("@")[0]]
          );

          return {
            id,
            email: credentials.email,
            name: credentials.name || credentials.email.split("@")[0],
          };
        } catch (erro) {
          console.error("[Auth] Erro:", (erro as Error).message);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
