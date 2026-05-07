"use client";

import { useSession, signIn } from "next-auth/react";
import AIStudio from "@/components/creator/AIStudio";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LogIn } from "lucide-react";

export default function NewProductPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center animate-fade-in">
        <LogIn className="h-12 w-12 text-gray-600" />
        <h2 className="mt-4 text-xl font-semibold text-white">Sign in to create a product</h2>
        <p className="mt-2 text-sm text-gray-500">You need an account to sell on Viajax.</p>
        <Button className="mt-6" onClick={() => signIn()}>
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Create a Product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload your ready product or let AI create one for you from a PDF.
        </p>
      </div>
      <AIStudio />
    </div>
  );
}
