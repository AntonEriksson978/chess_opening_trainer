import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Opening definitions (metadata)
  openings: defineTable({
    name: v.string(),
    eco: v.string(), // ECO code (e.g., "E60")
    moves: v.array(v.string()), // Main line moves in algebraic notation
    side: v.union(v.literal("white"), v.literal("black")),
    description: v.string(),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    userId: v.optional(v.id("users")), // null for system openings, set for user-created
  })
    .index("by_difficulty", ["difficulty"])
    .index("by_user", ["userId"]),

  // Additional lines/variations for an opening
  lines: defineTable({
    openingId: v.id("openings"),
    name: v.string(), // e.g., "Main Line", "Variation 1", "Anti-Berlin"
    moves: v.array(v.string()),
    order: v.number(), // Display order within the opening
  }).index("by_opening", ["openingId"]),

  // User's progress on specific lines
  userProgress: defineTable({
    userId: v.id("users"),
    openingId: v.id("openings"),
    lineId: v.optional(v.id("lines")), // null = main line, set = specific variation
    currentMoveIndex: v.number(), // How far they've progressed in this line
    correctCount: v.number(), // Times answered correctly
    incorrectCount: v.number(), // Times answered incorrectly
    easeFactor: v.number(), // SM-2 algorithm ease factor (2.5 default)
    interval: v.number(), // Days until next review
    nextReviewDate: v.number(), // Timestamp for next review
    lastReviewDate: v.optional(v.number()),
    isActive: v.boolean(), // Whether user wants to practice this line
  })
    .index("by_user", ["userId"])
    .index("by_user_and_opening", ["userId", "openingId"])
    .index("by_user_and_line", ["userId", "lineId"])
    .index("by_user_and_next_review", ["userId", "nextReviewDate"])
    .index("by_user_active", ["userId", "isActive"]),

  // Individual practice sessions
  practiceHistory: defineTable({
    userId: v.id("users"),
    openingId: v.id("openings"),
    moveIndex: v.number(),
    wasCorrect: v.boolean(),
    timeSpentMs: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_opening", ["openingId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
