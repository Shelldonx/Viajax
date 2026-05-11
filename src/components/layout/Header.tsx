"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, BookOpen, LayoutDashboard, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 font-bold text-white">
            V
          </div>
          <span className="text-xl font-bold text-white">
            Viajax<span className="text-teal-400">.es</span>
          </span>
        </Link>

        {/* Links desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/marketplace" className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white">
            <BookOpen className="h-4 w-4" />
            Marketplace
          </Link>
          {session && (
            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{session.user?.name || session.user?.email}</span>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/auth/signin">
              <Button variant="primary" size="sm">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-gray-800 bg-gray-950 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white" onClick={() => setMenuOpen(false)}>
              Marketplace
            </Link>
            {session && (
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            )}
            {session ? (
              <button className="text-left text-sm text-gray-400 hover:text-white" onClick={() => signOut()}>
                Sign Out
              </button>
            ) : (
              <Link href="/auth/signin" className="text-left text-sm text-teal-400 hover:text-teal-300" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
