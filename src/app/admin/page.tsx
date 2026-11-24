
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function AdminPage() {
  const currentUser = useQuery(api.users.getCurrentUser);

  if (currentUser === undefined) {
    return <p className="p-8">Checking administrator access...</p>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2">
          You do not have administrator privileges.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to home
        </Link>
      </main>
    );
  }

  return <AdminTools />;
}

function AdminTools() {
  const tools = useQuery(api.tools.listAll);

  if (tools === undefined) {
    return <p className="p-8">Loading admin dashboard...</p>;
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Admin Dashboard
      </h1>

      <Link
        href="/"
        className="mb-6 inline-block text-blue-600 hover:underline"
      >
        Back to home
      </Link>

      <h2 className="mb-4 text-2xl font-semibold">
        All Tools ({tools.length})
      </h2>

      {tools.length === 0 ? (
        <p className="text-gray-600">
          No tools have been listed yet.
        </p>
      ) : (
        <div className="space-y-4">
          {tools.map((tool) => (
            <article
              key={tool._id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <h3 className="text-lg font-semibold">
                {tool.title}
              </h3>

              <p className="mt-1 text-gray-700">
                {tool.description}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Category: {tool.category}
              </p>

              <p className="text-sm text-gray-600">
                Condition: {tool.condition}
              </p>

              <p className="text-sm text-gray-600">
                Status: {tool.status}
              </p>

              <p className="text-xs text-gray-500">
                Owner ID: {tool.ownerId}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

