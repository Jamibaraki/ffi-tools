
"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
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


  const removeTool = useMutation(api.tools.remove);
const [busyId, setBusyId] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);

async function handleRemove(id: (typeof tools extends (infer T)[] | undefined
  ? T extends { _id: infer ID }
    ? ID
    : never
  : never)) {
  if (!window.confirm("Are you sure you want to remove this listing?")) {
    return;
  }

  setError(null);
  setBusyId(id);

  try {
    await removeTool({ id });
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to remove listing."
    );
  } finally {
    setBusyId(null);
  }
}


  if (tools === undefined) {
    return <p className="p-8">Loading admin dashboard...</p>;
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
	{error && (
	  <p className="mb-4 text-sm text-red-600">{error}</p>
	)}
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

		<button
		  onClick={() => handleRemove(tool._id)}
		  disabled={busyId === tool._id}
		  className="mt-3 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
		>
		  {busyId === tool._id ? "Removing..." : "Remove listing"}
		</button>

            </article>
          ))}
        </div>
      )}
    <AdminLoans />
    <TrustedLenders />
    </main>
  );
}



function AdminLoans() {
  const requests = useQuery(api.borrowRequests.listAll);

  if (requests === undefined) {
    return <p>Loading borrowing requests...</p>;
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-2xl font-semibold">
        All Borrowing Requests ({requests.length})
      </h2>

      {requests.length === 0 ? (
        <p className="text-gray-600">
          No borrowing requests have been made yet.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request._id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <h3 className="text-lg font-semibold">
                {request.toolTitle}
              </h3>

              <p className="mt-1">
                Borrower: {request.borrowerName}
              </p>

              <p>
                Owner: {request.ownerName}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                {new Date(request.startDate).toLocaleDateString()} –{" "}
                {new Date(request.endDate).toLocaleDateString()}
              </p>

              <p className="mt-2">
                Status:{" "}
                <span className="font-semibold capitalize">
                  {request.status}
                </span>
              </p>

              {request.message && (
                <p className="mt-2 text-sm text-gray-600">
                  Message: {request.message}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}



function TrustedLenders() {
  const users = useQuery(api.users.listAll);
  const setTrustedLender = useMutation(api.users.setTrustedLender);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (users === undefined) {
    return <p>Loading users...</p>;
  }

  const handleToggle = async (
    userId: (typeof users)[number]["_id"],
    isTrustedLender: boolean
  ) => {
    setError(null);
    setBusyId(userId);

    try {
      await setTrustedLender({ userId, isTrustedLender });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update lender status."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-2xl font-semibold">
        Trusted Lenders
      </h2>

      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-4">
        {users
          .filter((user) => user.role !== "admin")
          .map((user) => (
            <article
              key={user._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-4"
            >
              <div>
                <h3 className="font-semibold">
                  {user.name || "Unnamed user"}
                </h3>
                <p className="text-sm text-gray-600">
                  {user.email || "No email"}
                </p>
                <p className="mt-1 text-sm">
                  {user.isTrustedLender
                    ? "Trusted Lender"
                    : "Standard lender"}
                </p>
              </div>

              <button
                onClick={() =>
                  handleToggle(user._id, !user.isTrustedLender)
                }
                disabled={busyId === user._id}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busyId === user._id
                  ? "Updating..."
                  : user.isTrustedLender
                    ? "Remove Trusted Status"
                    : "Mark as Trusted Lender"}
              </button>
            </article>
          ))}
      </div>
    </section>
  );
}

