"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Viajax Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-bold text-white">Something went wrong</h2>
      <p className="text-sm text-gray-400 max-w-md">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-600"
      >
        Try again
      </button>
    </div>
  );
}
