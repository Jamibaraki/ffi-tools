"use client";

import Link from "next/link";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">LendLoop</h1>

      <AuthLoading>
        <p>Checking authentication...</p>
      </AuthLoading>

      <Unauthenticated>
        <p>You are not signed in.</p>
        <Link
          href="/sign-in"
          className="rounded bg-blue-600 px-5 py-2 text-white"
        >
          Sign in
        </Link>
      </Unauthenticated>

      <Authenticated>
        <div className="flex items-center gap-3">
          <p>Convex authentication successful!</p>
          <UserButton />
        </div>
        <CurrentUser />
      </Authenticated>
    </main>
  );
}

function CurrentUser() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return <p>Loading user profile...</p>;
  }

  if (user === null) {
    return (
      <p>
        Authentication works, but no Convex user profile exists yet.
      </p>
    );
  }

  return (
    <div className="text-center">
      <p>Convex user profile found!</p>
      <p>{user.name ?? user.email ?? "User"}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
