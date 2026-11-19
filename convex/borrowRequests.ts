
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    toolId: v.id("tools"),
    startDate: v.number(),
    endDate: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication.
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in to request a tool.");
    }

    // Find the borrower's user profile.
    const borrower = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!borrower) {
      throw new Error("User profile not found.");
    }

    // Find the requested tool.
    const tool = await ctx.db.get(args.toolId);

    if (!tool || tool.status !== "available") {
      throw new Error("This tool is not available.");
    }

    // Prevent owners from borrowing their own tools.
    if (tool.ownerId === borrower._id) {
      throw new Error("You cannot request your own tool.");
    }

    // Validate the requested dates.
    if (
      !Number.isFinite(args.startDate) ||
      !Number.isFinite(args.endDate) ||
      args.startDate < Date.now() ||
      args.endDate <= args.startDate
    ) {
      throw new Error("Please provide valid future borrowing dates.");
    }

    // Check for overlapping active requests.
    const existingRequests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_tool", (q) =>
        q.eq("toolId", args.toolId)
      )
      .collect();

    const hasConflict = existingRequests.some((request) => {
      const isActive =
        request.status === "pending" ||
        request.status === "approved" ||
        request.status === "borrowed";

      const overlaps =
        args.startDate < request.endDate &&
        args.endDate > request.startDate;

      return isActive && overlaps;
    });

    if (hasConflict) {
      throw new Error(
        "This tool already has a request for those dates."
      );
    }

    // Create the pending request.
    return await ctx.db.insert("borrowRequests", {
      toolId: args.toolId,
      borrowerId: borrower._id,
      ownerId: tool.ownerId,
      startDate: args.startDate,
      endDate: args.endDate,
      message: args.message?.trim() || undefined,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

