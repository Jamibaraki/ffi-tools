
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    isTrustedLender: v.boolean(),
  }).index("by_clerk_id", ["clerkId"]),

  tools: defineTable({
    ownerId: v.id("users"),
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
    status: v.union(
      v.literal("available"),
      v.literal("unavailable"),
      v.literal("maintenance")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  borrowRequests: defineTable({
    toolId: v.id("tools"),
    borrowerId: v.id("users"),
    ownerId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("cancelled"),
      v.literal("borrowed"),
      v.literal("returned")
    ),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    returnedAt: v.optional(v.number()),
  })
    .index("by_tool", ["toolId"])
    .index("by_borrower", ["borrowerId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),
});

