
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useQuery,
  useMutation,
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { Suspense, useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ToolPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl p-8">
          <p>Loading tool page...</p>
        </main>
      }
    >
      <ToolPageContent />
    </Suspense>
  );
}



function ToolPageContent() {
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
      <Authenticated>
        <BorrowRequestForm
          toolId={tool._id}
          ownerId={tool.ownerId}
        />
      </Authenticated>

      <Unauthenticated>
        <p className="mt-6">
          <Link href="/sign-in" className="text-blue-600 hover:underline">
            Sign in
          </Link>{" "}
          to request this tool.
        </p>
      </Unauthenticated>
    </main>
  );
}



function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return formatLocalDate(date);
}

function BorrowRequestForm({
  toolId,
  ownerId,
}: {
  toolId: Id<"tools">;
  ownerId: Id<"users">;
}) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const createRequest = useMutation(api.borrowRequests.create);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = formatLocalDate(tomorrow);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (currentUser === undefined) {
    return <p className="mt-6">Loading your profile...</p>;
  }

  if (!currentUser) {
    return <p className="mt-6">Your user profile could not be found.</p>;
  }

  if (currentUser._id === ownerId) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!startDate || !endDate || endDate <= startDate) {
      setError("Please choose valid borrowing dates.");
      return;
    }

    setSubmitting(true);

    try {
      await createRequest({
        toolId,
        startDate: new Date(`${startDate}T00:00:00`).getTime(),
        endDate: new Date(`${endDate}T00:00:00`).getTime(),
        message: message.trim() || undefined,
      });

      setSuccess(true);
      setStartDate("");
      setEndDate("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-gray-200 p-6">
      <h2 className="mb-4 text-xl font-semibold">Request to borrow</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="startDate" className="mb-1 block font-medium">
            Start date
          </label>
          <input
            id="startDate"
            type="date"
            required
            min={minDate}
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setEndDate("");
            }}
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="mb-1 block font-medium">
            Return date
          </label>
          <input
            id="endDate"
            type="date"
            required
            min={startDate ? nextDate(startDate) : minDate}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label htmlFor="message" className="mb-1 block font-medium">
            Message (optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            className="w-full rounded border border-gray-300 p-2"
            placeholder="Introduce yourself or explain what you need the tool for."
          />
        </div>

        {error && <p className="text-red-600">{error}</p>}

        {success && (
          <p className="text-green-700">
            Your borrowing request has been submitted!
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Send request"}
        </button>
      </form>
    </section>
  );
}

