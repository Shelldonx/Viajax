"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { LogIn, ArrowLeft, Eye, EyeOff, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type UserRole = "creator" | "consumer";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("consumer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    authError === "CredentialsSignin"
      ? "Incorrect email or password."
      : authError
        ? "An error occurred. Please try again."
        : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        role,
        redirect: false,
      });

      if (result?.error) {
        setError("Incorrect email or password.");
      } else {
        // Redirect based on role
        if (role === "creator") {
          router.push("/dashboard/products/new");
        } else {
          router.push(callbackUrl === "/dashboard" ? "/marketplace" : callbackUrl);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-xl font-bold text-white">
              V
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome to Viajax</h1>
            <p className="mt-2 text-sm text-gray-400">
              Sign in or create your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">What do you want to do?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("consumer")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                    role === "consumer"
                      ? "border-teal-500 bg-teal-500/10 text-teal-400"
                      : "border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600"
                  )}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="text-xs font-medium">Buy Products</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("creator")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                    role === "creator"
                      ? "border-teal-500 bg-teal-500/10 text-teal-400"
                      : "border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600"
                  )}
                >
                  <Store className="h-5 w-5" />
                  <span className="text-xs font-medium">Sell Products</span>
                </button>
              </div>
            </div>

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              <LogIn className="h-4 w-4" />
              Sign In / Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-600">
            If you don&apos;t have an account, one will be created automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <SignInForm />
    </Suspense>
  );
}
