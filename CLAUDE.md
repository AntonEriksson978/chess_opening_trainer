# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chess Opening Trainer - a full-stack web app for practicing chess openings using spaced repetition (SM-2 algorithm). Built with React 19 + Convex serverless backend.

## Commands

```bash
npm run dev              # Start frontend (Vite) + backend (Convex) in parallel
npm run dev:frontend     # Frontend only with auto-open browser
npm run dev:backend      # Backend only (Convex dev server)
npm run build            # Production build
npm run lint             # TypeScript check + Convex validation + build
```

## Architecture

### Frontend (`src/`)
- **App.tsx** - Main component with view routing (Dashboard, Practice, Openings)
- **components/** - Dashboard (stats), Practice (interactive chess board), OpeningsList (toggle openings), ChessBoard (board rendering)
- Uses `useQuery()` and `useMutation()` from Convex React for data fetching

### Backend (`convex/`)
- **schema.ts** - Database tables: `openings`, `userProgress`, `practiceHistory` (plus auth tables)
- **practice.ts** - Core spaced repetition logic with SM-2 algorithm
- **openings.ts** - Opening CRUD, `seedOpenings()` for initial data
- **auth.ts** - Convex Auth with Password and Anonymous providers

### Key Data Flow
1. User activates openings in OpeningsList → creates `userProgress` records
2. Practice view fetches next due opening via `getNextPractice()` (sorted by `nextReviewDate`)
3. User submits moves → `submitPractice()` updates SM-2 factors (easeFactor, interval, nextReviewDate)
4. Every 3 correct answers advances `currentMoveIndex` to learn next move in sequence

## Convex Patterns

**Always use the new function syntax with validators:**
```typescript
export const myQuery = query({
  args: { id: v.id("openings") },
  returns: v.object({ ... }),
  handler: async (ctx, args) => { ... },
});
```

**Get authenticated user in backend:**
```typescript
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Not authenticated");
```

**Use indexes, not filter:**
```typescript
// Good - uses index
ctx.db.query("userProgress")
  .withIndex("by_user_and_opening", q => q.eq("userId", userId).eq("openingId", id))

// Bad - avoid filter
ctx.db.query("userProgress").filter(q => q.eq(q.field("userId"), userId))
```

See `.cursor/rules/convex_rules.mdc` for comprehensive Convex guidelines including pagination, file storage, and scheduling.

## Database Schema

Three main tables with key indexes:

- **openings** - Chess opening templates (name, ECO code, moves[], side, difficulty)
  - Index: `by_difficulty`

- **userProgress** - Per-user per-opening progress tracking
  - `currentMoveIndex` - Progress through move sequence
  - `easeFactor`, `interval`, `nextReviewDate` - SM-2 spaced repetition state
  - Indexes: `by_user`, `by_user_and_opening`, `by_user_and_next_review`, `by_user_active`

- **practiceHistory** - Individual practice session records

## Styling

Tailwind CSS with chess-themed colors defined in `tailwind.config.js`:
- `bg-board-light`, `bg-board-dark` - Lichess-style board colors
- Custom primary/secondary/accent palette
