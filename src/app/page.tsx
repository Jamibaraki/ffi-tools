"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";

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
      <ToolCatalogue />
    </main>
  );
}

function CurrentUser() {
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
  const user = useQuery(api.users.getCurrentUser);

  const [profileReady, setProfileReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    ensureCurrentUser()
      .then(() => {
        if (!cancelled) {
          setProfileReady(true);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ensureCurrentUser]);

  if (error) {
    return <p>Profile creation failed: {error}</p>;
  }

  if (!profileReady || user === undefined) {
    return <p>Creating your user profile...</p>;
  }

  if (user === null) {
    return <p>Profile not found. Please refresh the page.</p>;
  }

  return (
    <div className="text-center">
      <p>Convex user profile found!</p>
      <p>{user.name ?? user.email ?? "User"}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}

function ToolCatalogue() {
  const tools = useQuery(api.tools.list);

  if (tools === undefined) {
    return <p>Loading tools...</p>;
  }

  return (
    <section className="w-full max-w-3xl mt-12">
      <h2 className="text-2xl font-bold mb-6">
        Available Tools
      </h2>

      {tools.length === 0 ? (
        <p className="text-zinc-500">
          No tools are available yet. Check back soon!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <article
              key={tool._id}
              className="rounded-lg border border-zinc-200 p-5"
            >
              <h3 className="text-lg font-semibold">
                {tool.title}
              </h3>

              <p className="mt-2 text-sm text-zinc-600">
                {tool.description}
              </p>

              <div className="mt-4 flex justify-between text-sm text-zinc-500">
                <span>{tool.category}</span>
                <span>Condition: {tool.condition}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
