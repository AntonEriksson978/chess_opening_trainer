import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get next opening/line to practice based on spaced repetition
export const getNextPractice = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const now = Date.now();

    // Get all active openings/lines due for review
    const dueProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    const due = dueProgress.filter((p) => p.nextReviewDate <= now);

    if (due.length === 0) return null;

    // Sort by next review date (oldest first)
    due.sort((a, b) => a.nextReviewDate - b.nextReviewDate);

    const progress = due[0];
    const opening = await ctx.db.get(progress.openingId);

    if (!opening) return null;

    // If practicing a specific line, get those moves
    let moves = opening.moves;
    let lineName: string | null = null;
    if (progress.lineId) {
      const line = await ctx.db.get(progress.lineId);
      if (line) {
        moves = line.moves;
        lineName = line.name;
      }
    }

    return {
      opening,
      progress,
      moveIndex: progress.currentMoveIndex,
      moves, // The actual moves to practice
      lineName, // Name of the line if practicing a variation
    };
  },
});

// Get statistics for dashboard
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const allProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const activeProgress = allProgress.filter(p => p.isActive);
    const now = Date.now();
    const dueCount = activeProgress.filter(p => p.nextReviewDate <= now).length;
    
    const totalCorrect = activeProgress.reduce((sum, p) => sum + p.correctCount, 0);
    const totalIncorrect = activeProgress.reduce((sum, p) => sum + p.incorrectCount, 0);
    const accuracy = totalCorrect + totalIncorrect > 0 
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

    return {
      activeOpenings: activeProgress.length,
      dueForReview: dueCount,
      totalPracticed: totalCorrect + totalIncorrect,
      accuracy,
    };
  },
});

// Submit practice result and update spaced repetition
export const submitPractice = mutation({
  args: {
    openingId: v.id("openings"),
    lineId: v.optional(v.id("lines")),
    moveIndex: v.number(),
    wasCorrect: v.boolean(),
    timeSpentMs: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Record practice history
    await ctx.db.insert("practiceHistory", {
      userId,
      openingId: args.openingId,
      moveIndex: args.moveIndex,
      wasCorrect: args.wasCorrect,
      timeSpentMs: args.timeSpentMs,
    });

    // Get current progress (for main line or specific line)
    let progress;
    if (args.lineId) {
      progress = await ctx.db
        .query("userProgress")
        .withIndex("by_user_and_line", (q) =>
          q.eq("userId", userId).eq("lineId", args.lineId)
        )
        .first();
    } else {
      progress = await ctx.db
        .query("userProgress")
        .withIndex("by_user_and_opening", (q) =>
          q.eq("userId", userId).eq("openingId", args.openingId)
        )
        .filter((q) => q.eq(q.field("lineId"), undefined))
        .first();
    }

    if (!progress) throw new Error("Progress not found");

    // Get the moves array (from line or opening)
    let moves: string[];
    if (args.lineId) {
      const line = await ctx.db.get(args.lineId);
      if (!line) throw new Error("Line not found");
      moves = line.moves;
    } else {
      const opening = await ctx.db.get(args.openingId);
      if (!opening) throw new Error("Opening not found");
      moves = opening.moves;
    }

    // Update counts
    const correctCount = progress.correctCount + (args.wasCorrect ? 1 : 0);
    const incorrectCount = progress.incorrectCount + (args.wasCorrect ? 0 : 1);

    // SM-2 Algorithm for spaced repetition
    let easeFactor = progress.easeFactor;
    let interval = progress.interval;
    
    if (args.wasCorrect) {
      // Increase ease factor slightly
      easeFactor = Math.max(1.3, easeFactor + 0.1);
      
      // Calculate next interval
      if (interval === 0) {
        interval = 1; // 1 day
      } else if (interval === 1) {
        interval = 6; // 6 days
      } else {
        interval = Math.round(interval * easeFactor);
      }
      
      // Advance to next move if mastered current one
      let newMoveIndex = progress.currentMoveIndex;
      if (correctCount % 3 === 0 && newMoveIndex < moves.length - 1) {
        newMoveIndex++;
      }

      await ctx.db.patch(progress._id, {
        correctCount,
        incorrectCount,
        easeFactor,
        interval,
        nextReviewDate: Date.now() + interval * 24 * 60 * 60 * 1000,
        lastReviewDate: Date.now(),
        currentMoveIndex: newMoveIndex,
      });
    } else {
      // Decrease ease factor
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      interval = 0; // Reset interval
      
      await ctx.db.patch(progress._id, {
        correctCount,
        incorrectCount,
        easeFactor,
        interval,
        nextReviewDate: Date.now(), // Review again immediately
        lastReviewDate: Date.now(),
      });
    }
  },
});
