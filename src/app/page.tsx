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
	<AddToolForm />
	<MyTools />
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


function AddToolForm() {
  const createTool = useMutation(api.tools.create);
  const user = useQuery(api.users.getCurrentUser);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<
    "new" | "good" | "fair" | "worn"
  >("good");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await createTool({
        title,
        description,
        category,
        condition,
      });

      setTitle("");
      setDescription("");
      setCategory("");
      setCondition("good");
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 w-full max-w-3xl">
      <h2 className="mb-6 text-2xl font-bold">
        Add a Tool
      </h2>

      {user === undefined ? (
        <p>Loading your profile...</p>
      ) : user === null ? (
        <p>Your user profile is not available.</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-6"
        >
          <div>
            <label htmlFor="tool-title" className="block mb-1 font-medium">
              Tool name
            </label>
            <input
              id="tool-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded border border-zinc-300 p-2"
              placeholder="e.g. Cordless drill"
            />
          </div>

          <div>
            <label htmlFor="tool-description" className="block mb-1 font-medium">
              Description
            </label>
            <textarea
              id="tool-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={1000}
              rows={3}
              className="w-full rounded border border-zinc-300 p-2"
              placeholder="Describe the tool and how it can be used..."
            />
          </div>

          <div>
            <label htmlFor="tool-category" className="block mb-1 font-medium">
              Category
            </label>
            <input
              id="tool-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              maxLength={50}
              className="w-full rounded border border-zinc-300 p-2"
              placeholder="e.g. DIY, Gardening, Kitchen"
            />
          </div>

          <div>
            <label htmlFor="tool-condition" className="block mb-1 font-medium">
              Condition
            </label>
            <select
              id="tool-condition"
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as typeof condition)
              }
              className="w-full rounded border border-zinc-300 p-2"
            >
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="worn">Worn</option>
            </select>
          </div>

          {error && (
            <p className="text-red-600">{error}</p>
          )}

          {success && (
            <p className="text-green-700">
              Tool added successfully!
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !user}
            className="rounded bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Adding tool..." : "Add Tool"}
          </button>
        </form>
      )}
    </section>
  );
}



function MyTools() {
  const tools = useQuery(api.tools.listMine);
  const removeTool = useMutation(api.tools.remove);

  const updateTool = useMutation(api.tools.update);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCondition, setEditCondition] = useState<
  "new" | "good" | "fair" | "worn"
>("good");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (tools === undefined) {
    return <p>Loading your tools...</p>;
  }

  return (
    <section className="mt-12 w-full max-w-3xl">
      <h2 className="mb-6 text-2xl font-bold">
        My Tools
      </h2>

      {tools.length === 0 ? (
        <p className="text-zinc-500">
          You haven&apos;t listed any tools yet.
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

              <p className="mt-2 text-xs text-zinc-500">
                Status: {tool.status}
              </p>


<div className="mt-4 flex gap-2">
  <button
    type="button"
    onClick={() => {
      setEditingId(tool._id);
      setEditTitle(tool.title);
      setEditDescription(tool.description);
      setEditCategory(tool.category);
      setEditCondition(tool.condition);
      setEditError(null);
    }}
    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
  >
    Edit
  </button>

  <button
    type="button"
    onClick={async () => {
      if (
        !window.confirm(
          `Are you sure you want to remove "${tool.title}"?`
        )
      ) {
        return;
      }

      try {
        await removeTool({ id: tool._id });
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Failed to remove tool."
        );
      }
    }}
    className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
  >
    Remove
  </button>
</div>

{editingId === tool._id && (
  <form
    className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4"
    onSubmit={async (event) => {
      event.preventDefault();
      setSaving(true);
      setEditError(null);

      try {
        await updateTool({
          id: tool._id,
          title: editTitle,
          description: editDescription,
          category: editCategory,
          condition: editCondition,
        });

        setEditingId(null);
      } catch (error) {
        setEditError(
          error instanceof Error
            ? error.message
            : "Failed to update tool."
        );
      } finally {
        setSaving(false);
      }
    }}
  >
    <label className="font-medium" htmlFor={`edit-title-${tool._id}`}>
      Tool name
    </label>
    <input
      id={`edit-title-${tool._id}`}
      value={editTitle}
      onChange={(event) => setEditTitle(event.target.value)}
      required
      maxLength={100}
      className="rounded border border-zinc-300 p-2"
    />

    <label className="font-medium" htmlFor={`edit-description-${tool._id}`}>
      Description
    </label>
    <textarea
      id={`edit-description-${tool._id}`}
      value={editDescription}
      onChange={(event) => setEditDescription(event.target.value)}
      required
      maxLength={1000}
      rows={3}
      className="rounded border border-zinc-300 p-2"
    />

    <label className="font-medium" htmlFor={`edit-category-${tool._id}`}>
      Category
    </label>
    <input
      id={`edit-category-${tool._id}`}
      value={editCategory}
      onChange={(event) => setEditCategory(event.target.value)}
      required
      maxLength={50}
      className="rounded border border-zinc-300 p-2"
    />

    <label className="font-medium" htmlFor={`edit-condition-${tool._id}`}>
      Condition
    </label>
    <select
      id={`edit-condition-${tool._id}`}
      value={editCondition}
      onChange={(event) =>
        setEditCondition(event.target.value as typeof editCondition)
      }
      className="rounded border border-zinc-300 p-2"
    >
      <option value="new">New</option>
      <option value="good">Good</option>
      <option value="fair">Fair</option>
      <option value="worn">Worn</option>
    </select>

    {editError && (
      <p className="text-sm text-red-600">{editError}</p>
    )}

    <div className="flex gap-2">
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      <button
        type="button"
        onClick={() => setEditingId(null)}
        className="rounded border border-zinc-300 px-4 py-2 text-sm"
      >
        Cancel
      </button>
    </div>
  </form>
)}


            </article>
          ))}
        </div>
      )}
    </section>
  );
}

