import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all available openings with their lines
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const openings = await ctx.db.query("openings").collect();

    // Get user's progress and lines for each opening
    const openingsWithProgress = await Promise.all(
      openings.map(async (opening) => {
        // Get all lines for this opening
        const lines = await ctx.db
          .query("lines")
          .withIndex("by_opening", (q) => q.eq("openingId", opening._id))
          .collect();

        // Get progress for main line
        const mainLineProgress = await ctx.db
          .query("userProgress")
          .withIndex("by_user_and_opening", (q) =>
            q.eq("userId", userId).eq("openingId", opening._id)
          )
          .filter((q) => q.eq(q.field("lineId"), undefined))
          .first();

        // Get progress for each line
        const linesWithProgress = await Promise.all(
          lines.map(async (line) => {
            const progress = await ctx.db
              .query("userProgress")
              .withIndex("by_user_and_line", (q) =>
                q.eq("userId", userId).eq("lineId", line._id)
              )
              .first();
            return {
              ...line,
              isActive: progress?.isActive ?? false,
              currentMoveIndex: progress?.currentMoveIndex ?? 0,
              totalMoves: line.moves.length,
            };
          })
        );

        return {
          ...opening,
          lines: linesWithProgress.sort((a, b) => a.order - b.order),
          isActive: mainLineProgress?.isActive ?? false,
          currentMoveIndex: mainLineProgress?.currentMoveIndex ?? 0,
          totalMoves: opening.moves.length,
          nextReviewDate: mainLineProgress?.nextReviewDate,
          isUserCreated: opening.userId === userId,
        };
      })
    );

    return openingsWithProgress;
  },
});

// Toggle whether user wants to practice an opening's main line or a specific line
export const toggleActive = mutation({
  args: {
    openingId: v.id("openings"),
    lineId: v.optional(v.id("lines")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let existing;
    if (args.lineId) {
      existing = await ctx.db
        .query("userProgress")
        .withIndex("by_user_and_line", (q) =>
          q.eq("userId", userId).eq("lineId", args.lineId)
        )
        .first();
    } else {
      existing = await ctx.db
        .query("userProgress")
        .withIndex("by_user_and_opening", (q) =>
          q.eq("userId", userId).eq("openingId", args.openingId)
        )
        .filter((q) => q.eq(q.field("lineId"), undefined))
        .first();
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: !existing.isActive,
      });
    } else {
      // Create new progress entry
      await ctx.db.insert("userProgress", {
        userId,
        openingId: args.openingId,
        lineId: args.lineId,
        currentMoveIndex: 0,
        correctCount: 0,
        incorrectCount: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReviewDate: Date.now(),
        isActive: true,
      });
    }
  },
});

// Create a new opening
export const createOpening = mutation({
  args: {
    name: v.string(),
    eco: v.string(),
    moves: v.array(v.string()),
    side: v.union(v.literal("white"), v.literal("black")),
    description: v.string(),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const openingId = await ctx.db.insert("openings", {
      ...args,
      userId,
    });

    return openingId;
  },
});

// Update an existing opening
export const updateOpening = mutation({
  args: {
    openingId: v.id("openings"),
    name: v.optional(v.string()),
    eco: v.optional(v.string()),
    moves: v.optional(v.array(v.string())),
    side: v.optional(v.union(v.literal("white"), v.literal("black"))),
    description: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const opening = await ctx.db.get(args.openingId);
    if (!opening) throw new Error("Opening not found");

    // Only allow editing user's own openings or system openings (for now, allow all)
    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.eco !== undefined) updates.eco = args.eco;
    if (args.moves !== undefined) updates.moves = args.moves;
    if (args.side !== undefined) updates.side = args.side;
    if (args.description !== undefined) updates.description = args.description;
    if (args.difficulty !== undefined) updates.difficulty = args.difficulty;

    await ctx.db.patch(args.openingId, updates);
  },
});

// Delete an opening
export const deleteOpening = mutation({
  args: {
    openingId: v.id("openings"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all lines for this opening
    const lines = await ctx.db
      .query("lines")
      .withIndex("by_opening", (q) => q.eq("openingId", args.openingId))
      .collect();

    for (const line of lines) {
      await ctx.db.delete(line._id);
    }

    // Delete all user progress for this opening
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_and_opening", (q) =>
        q.eq("userId", userId).eq("openingId", args.openingId)
      )
      .collect();

    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    await ctx.db.delete(args.openingId);
  },
});

// Add a new line to an opening
export const addLine = mutation({
  args: {
    openingId: v.id("openings"),
    name: v.string(),
    moves: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get highest order number
    const existingLines = await ctx.db
      .query("lines")
      .withIndex("by_opening", (q) => q.eq("openingId", args.openingId))
      .collect();

    const maxOrder = existingLines.length > 0
      ? Math.max(...existingLines.map((l) => l.order))
      : 0;

    const lineId = await ctx.db.insert("lines", {
      openingId: args.openingId,
      name: args.name,
      moves: args.moves,
      order: maxOrder + 1,
    });

    return lineId;
  },
});

// Update a line
export const updateLine = mutation({
  args: {
    lineId: v.id("lines"),
    name: v.optional(v.string()),
    moves: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.moves !== undefined) updates.moves = args.moves;

    await ctx.db.patch(args.lineId, updates);
  },
});

// Delete a line
export const deleteLine = mutation({
  args: {
    lineId: v.id("lines"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const line = await ctx.db.get(args.lineId);
    if (!line) throw new Error("Line not found");

    // Delete user progress for this line
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_and_line", (q) =>
        q.eq("userId", userId).eq("lineId", args.lineId)
      )
      .collect();

    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    await ctx.db.delete(args.lineId);
  },
});

// Get a single opening with all its lines
export const getOpening = query({
  args: {
    openingId: v.id("openings"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const opening = await ctx.db.get(args.openingId);
    if (!opening) return null;

    const lines = await ctx.db
      .query("lines")
      .withIndex("by_opening", (q) => q.eq("openingId", args.openingId))
      .collect();

    return {
      ...opening,
      lines: lines.sort((a, b) => a.order - b.order),
    };
  },
});

// Seed initial openings (can be called from client on first load)
export const seedOpenings = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const existingCount = await ctx.db.query("openings").collect();
    if (existingCount.length > 0) return;

    const openings = [
      {
        name: "Italian Game",
        eco: "C50",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4"],
        side: "white" as const,
        description: "A classical opening focusing on central control and quick development.",
        difficulty: "beginner" as const,
      },
      {
        name: "Sicilian Defense - Najdorf",
        eco: "B90",
        moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
        side: "black" as const,
        description: "Sharp and aggressive defense, popular at all levels.",
        difficulty: "advanced" as const,
      },
      {
        name: "Queen's Gambit Declined",
        eco: "D30",
        moves: ["d4", "d5", "c4", "e6", "Nf3", "Nf6", "Bg5", "Be7", "e3", "O-O"],
        side: "black" as const,
        description: "Solid and classical response to the Queen's Gambit.",
        difficulty: "intermediate" as const,
      },
      {
        name: "Ruy Lopez - Berlin Defense",
        eco: "C67",
        moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4", "d4", "Nd6"],
        side: "black" as const,
        description: "Modern defensive system, very solid and reliable.",
        difficulty: "intermediate" as const,
      },
      {
        name: "King's Indian Defense",
        eco: "E60",
        moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O"],
        side: "black" as const,
        description: "Hypermodern opening with counterattacking chances.",
        difficulty: "intermediate" as const,
      },
      {
        name: "London System",
        eco: "D02",
        moves: ["d4", "d5", "Nf3", "Nf6", "Bf4", "c5", "e3", "Nc6", "c3", "Qb6"],
        side: "white" as const,
        description: "Flexible and easy-to-learn system for White.",
        difficulty: "beginner" as const,
      },
      {
        name: "French Defense - Winawer",
        eco: "C15",
        moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+"],
        side: "black" as const,
        description: "Sharp tactical variation of the French Defense.",
        difficulty: "advanced" as const,
      },
      {
        name: "Caro-Kann Defense",
        eco: "B10",
        moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6"],
        side: "black" as const,
        description: "Solid defense with good pawn structure.",
        difficulty: "beginner" as const,
      },
    ];

    for (const opening of openings) {
      await ctx.db.insert("openings", opening);
    }
  },
});
