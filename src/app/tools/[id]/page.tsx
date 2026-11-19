
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ToolPage() {
  const params = useParams<{ id: string }>();
  const toolId = params.id as Id<"tools">;

  const tool = useQuery(api.tools.getById, { id: toolId });

  if (tool === undefined) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p>Loading tool...</p>
      </main>
    );
  }

  if (tool === null) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="mb-4 text-2xl font-bold">Tool not found</h1>
        <p className="mb-6">
          This tool may have been removed or is no longer available.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to catalogue
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/" className="mb-6 inline-block text-blue-600 hover:underline">
        &larr; Back to catalogue
      </Link>

      <article className="rounded-lg border border-gray-200 p-6">
        <h1 className="mb-4 text-3xl font-bold">{tool.title}</h1>

        <p className="mb-6 whitespace-pre-wrap">{tool.description}</p>

        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="font-semibold text-gray-600">Category</dt>
            <dd>{tool.category}</dd>
          </div>

          <div>
            <dt className="font-semibold text-gray-600">Condition</dt>
            <dd className="capitalize">{tool.condition}</dd>
          </div>

          <div>
            <dt className="font-semibold text-gray-600">Availability</dt>
            <dd className="capitalize">{tool.status}</dd>
          </div>
        </dl>
      </article>
    </main>
  );
}

