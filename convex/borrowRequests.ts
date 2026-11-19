
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const listIncoming = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) return [];

    const requests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_owner", (q) =>
        q.eq("ownerId", user._id)
      )
      .order("desc")
      .collect();

    // Include the tool and borrower details for the interface.
    return await Promise.all(
      requests.map(async (request) => {
        const tool = await ctx.db.get(request.toolId);
        const borrower = await ctx.db.get(request.borrowerId);

        return {
          ...request,
          toolTitle: tool?.title ?? "Deleted tool",
          borrowerName: borrower?.name ?? "Unknown borrower",
        };
      })
    );
  },
});




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



export const review = mutation({
  args: {
    requestId: v.id("borrowRequests"),
    decision: v.union(
      v.literal("approved"),
      v.literal("declined")
    ),
  },
  handler: async (ctx, args) => {
    // Require authentication.
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in to review requests.");
    }

    // Find the current user.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("User profile not found.");
    }

    // Find the borrowing request.
    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Borrowing request not found.");
    }

    // Only the tool's owner can review the request.
    if (request.ownerId !== user._id) {
      throw new Error("You cannot review this request.");
    }

    // Only pending requests can be reviewed.
    if (request.status !== "pending") {
      throw new Error("This request has already been reviewed.");
    }

    if (args.decision === "approved") {
      const tool = await ctx.db.get(request.toolId);

      if (!tool || tool.status !== "available") {
        throw new Error("This tool is no longer available.");
      }

      // Check that no other active request overlaps these dates.
      const existingRequests = await ctx.db
        .query("borrowRequests")
        .withIndex("by_tool", (q) =>
          q.eq("toolId", request.toolId)
        )
        .collect();

      const hasConflict = existingRequests.some((existing) => {
        if (existing._id === request._id) return false;

        const isActive =
          existing.status === "pending" ||
          existing.status === "approved" ||
          existing.status === "borrowed";

        const overlaps =
          request.startDate < existing.endDate &&
          request.endDate > existing.startDate;

        return isActive && overlaps;
      });

      if (hasConflict) {
        throw new Error(
          "Another active request conflicts with these dates."
        );
      }
    }

    await ctx.db.patch(args.requestId, {
      status: args.decision,
      reviewedAt: Date.now(),
    });
  },
});



export const updateLoanStatus = mutation({
  args: {
    requestId: v.id("borrowRequests"),
    status: v.union(
      v.literal("borrowed"),
      v.literal("returned")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("You must be signed in.");
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

    const request = await ctx.db.get(args.requestId);

    if (!request) {
      throw new Error("Borrowing request not found.");
    }

    // Only the tool owner can update the loan status.
    if (request.ownerId !== user._id) {
      throw new Error("You cannot update this loan.");
    }

    // Enforce the correct sequence of transitions.
    if (
      args.status === "borrowed" &&
      request.status !== "approved"
    ) {
      throw new Error("Only approved requests can become borrowed.");
    }

    if (
      args.status === "returned" &&
      request.status !== "borrowed"
    ) {
      throw new Error("Only borrowed tools can be marked as returned.");
    }

    await ctx.db.patch(args.requestId, {
      status: args.status,
      ...(args.status === "returned" && {
        returnedAt: Date.now(),
      }),
    });
  },
});

