import { Chess } from "chess.js";

// Build a Chess instance from a list of SAN moves
export function getGameFromMoves(moves: string[]): Chess {
  const game = new Chess();
  for (const move of moves) {
    game.move(move);
  }
  return game;
}

// Convert Chess board to our Record<string, string> format
export function getBoardState(game: Chess): Record<string, string> {
  const board: Record<string, string> = {};
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];

  for (const file of files) {
    for (const rank of ranks) {
      const square = `${file}${rank}` as "a1";
      const piece = game.get(square);
      if (piece) {
        // chess.js uses {type: 'p', color: 'w'}, convert to 'P' or 'p'
        board[square] = piece.color === "w"
          ? piece.type.toUpperCase()
          : piece.type.toLowerCase();
      }
    }
  }
  return board;
}

// Try to make a move from coordinate format, returns SAN if legal, null if illegal
export function tryMove(game: Chess, from: string, to: string): string | null {
  try {
    const move = game.move({ from: from as "a1", to: to as "a1", promotion: "q" }); // Auto-queen for now
    if (move) {
      game.undo(); // Don't mutate the game
      return move.san;
    }
  } catch {
    return null;
  }
  return null;
}

// Get legal destination squares for a piece
export function getLegalMoves(game: Chess, square: string): string[] {
  const moves = game.moves({ square: square as "a1", verbose: true });
  return moves.map(m => m.to);
}
