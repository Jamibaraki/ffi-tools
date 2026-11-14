
import { query } from "./_generated/server";
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

