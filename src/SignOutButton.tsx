"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-3 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
      onClick={() => void signOut()}
    >
      Sign out
    </button>
  );
}
