
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Return all publicly available tools.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tools")
      .withIndex("by_status", (q) =>
        q.eq("status", "available")
      )
      .order("desc")
      .collect();
  },
});

// Return tools belonging to the authenticated user.
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("tools")
      .withIndex("by_owner", (q) =>
        q.eq("ownerId", user._id)
      )
      .order("desc")
      .take(100);
  },
});

// Return a single available tool by ID.
export const getById = query({
  args: {
    id: v.id("tools"),
  },
  handler: async (ctx, args) => {
    const tool = await ctx.db.get(args.id);

    if (!tool || tool.status !== "available") {
      return null;
    }

    return tool;
  },
});

// Create a new tool owned by the authenticated user.
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    condition: v.union(
      v.literal("new"),
      v.literal("good"),
      v.literal("fair"),
      v.literal("worn")
    ),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in to add a tool.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("User profile not found.");
    }

    if (!args.title.trim() || !args.description.trim()) {
      throw new Error("Title and description cannot be empty.");
    }

    const now = Date.now();

    return await ctx.db.insert("tools", {
      ownerId: user._id,
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category.trim(),
      condition: args.condition,
      imageId: args.imageId,
      status: "available",
      createdAt: now,
      updatedAt: now,
    });
  },
});


// Update a tool, provided the user owns it or is an admin.
export const update = mutation({
  args: {
    id: v.id("tools"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    condition: v.optional(
      v.union(
        v.literal("new"),
        v.literal("good"),
        v.literal("fair"),
        v.literal("worn")
      )
    ),
    imageId: v.optional(v.id("_storage")),
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("unavailable"),
        v.literal("maintenance")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in to edit a tool.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("User profile not found.");
    }

    const tool = await ctx.db.get(args.id);

    if (!tool) {
      throw new Error("Tool not found.");
    }

    if (tool.ownerId !== user._id && user.role !== "admin") {
      throw new Error("You do not have permission to edit this tool.");
    }

    if (
      (args.title !== undefined && !args.title.trim()) ||
      (args.description !== undefined && !args.description.trim())
    ) {
      throw new Error("Title and description cannot be empty.");
    }

    const { id, ...fields } = args;

    const updates = {
      ...(fields.title !== undefined && { title: fields.title.trim() }),
      ...(fields.description !== undefined && {
        description: fields.description.trim(),
      }),
      ...(fields.category !== undefined && {
        category: fields.category.trim(),
      }),
      ...(fields.condition !== undefined && {
        condition: fields.condition,
      }),
      ...(fields.imageId !== undefined && { imageId: fields.imageId }),
      ...(fields.status !== undefined && { status: fields.status }),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(id, updates);
  },
});
